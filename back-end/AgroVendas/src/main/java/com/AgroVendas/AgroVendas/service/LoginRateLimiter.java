package com.AgroVendas.AgroVendas.service;

import com.AgroVendas.AgroVendas.exception.TooManyAttemptsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Sliding-window limit on failed logins, counted per e-mail address and per client address.
 * Unknown e-mails are counted like known ones, so locking out does not reveal which accounts exist.
 *
 * State lives in this process: fine for a single instance, but each replica would keep its own
 * counters. Behind a shared proxy, enable the forwarded-headers strategy so the client address
 * is the real one.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_TRACKED_KEYS = 10_000;

    private final int maxPorEmail;
    private final int maxPorIp;
    private final Duration janela;
    private final Clock clock;

    private final Map<String, Deque<Long>> falhasPorEmail = new HashMap<>();
    private final Map<String, Deque<Long>> falhasPorIp = new HashMap<>();

    @Autowired
    public LoginRateLimiter(
            @Value("${app.security.login.max-attempts-per-email:5}") int maxPorEmail,
            @Value("${app.security.login.max-attempts-per-ip:30}") int maxPorIp,
            @Value("${app.security.login.window-seconds:900}") long janelaSegundos) {
        this(maxPorEmail, maxPorIp, Duration.ofSeconds(janelaSegundos), Clock.systemUTC());
    }

    LoginRateLimiter(int maxPorEmail, int maxPorIp, Duration janela, Clock clock) {
        this.maxPorEmail = maxPorEmail;
        this.maxPorIp = maxPorIp;
        this.janela = janela;
        this.clock = clock;
    }

    /** Throws when this e-mail or this address already used up its failed attempts. */
    public synchronized void verificar(String email, String ip) {
        long agora = clock.millis();
        long espera = Math.max(
                esperaSegundos(falhasPorEmail, chaveEmail(email), maxPorEmail, agora),
                esperaSegundos(falhasPorIp, ip, maxPorIp, agora));
        if (espera > 0) {
            throw new TooManyAttemptsException(espera);
        }
    }

    public synchronized void registrarFalha(String email, String ip) {
        long agora = clock.millis();
        registrar(falhasPorEmail, chaveEmail(email), agora);
        registrar(falhasPorIp, ip, agora);
    }

    public synchronized void registrarSucesso(String email) {
        falhasPorEmail.remove(chaveEmail(email));
    }

    private long esperaSegundos(Map<String, Deque<Long>> mapa, String chave, int limite, long agora) {
        Deque<Long> falhas = mapa.get(chave);
        if (falhas == null) {
            return 0;
        }
        descartarExpiradas(falhas, agora);
        if (falhas.isEmpty()) {
            mapa.remove(chave);
            return 0;
        }
        if (falhas.size() < limite) {
            return 0;
        }
        long liberaEm = falhas.peekFirst() + janela.toMillis();
        return Math.max(1, (liberaEm - agora + 999) / 1000);
    }

    private void registrar(Map<String, Deque<Long>> mapa, String chave, long agora) {
        if (mapa.size() >= MAX_TRACKED_KEYS) {
            mapa.values().removeIf(falhas -> {
                descartarExpiradas(falhas, agora);
                return falhas.isEmpty();
            });
        }
        Deque<Long> falhas = mapa.computeIfAbsent(chave, k -> new ArrayDeque<>());
        descartarExpiradas(falhas, agora);
        falhas.addLast(agora);
    }

    private void descartarExpiradas(Deque<Long> falhas, long agora) {
        long corte = agora - janela.toMillis();
        while (!falhas.isEmpty() && falhas.peekFirst() <= corte) {
            falhas.pollFirst();
        }
    }

    private static String chaveEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
