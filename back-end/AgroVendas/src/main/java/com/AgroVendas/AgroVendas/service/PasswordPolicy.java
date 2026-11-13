package com.AgroVendas.AgroVendas.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

/**
 * Rules for new passwords. They apply when a password is created or changed; existing passwords
 * are not re-checked. The upper bound exists because bcrypt only uses the first 72 bytes.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_BYTES = 72;

    private static final Set<String> COMMON = Set.of(
            "12345678", "123456789", "1234567890", "password", "password1", "senha123", "senha1234",
            "qwerty123", "abc12345", "agrovendas", "agrovendas1", "mudar123", "admin123", "admin1234",
            "11111111", "00000000", "12341234", "a1234567", "senha@123", "brasil123");

    private PasswordPolicy() {
    }

    /** @throws IllegalArgumentException with a message safe to show to the user */
    public static void validar(String senha, String email) {
        if (senha == null || senha.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("A senha deve ter pelo menos " + MIN_LENGTH + " caracteres");
        }
        if (senha.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw new IllegalArgumentException("A senha deve ter no máximo " + MAX_BYTES + " bytes");
        }
        boolean temLetra = senha.chars().anyMatch(Character::isLetter);
        boolean temDigito = senha.chars().anyMatch(Character::isDigit);
        if (!temLetra || !temDigito) {
            throw new IllegalArgumentException("A senha deve ter letras e números");
        }
        String minuscula = senha.toLowerCase(Locale.ROOT);
        if (COMMON.contains(minuscula)) {
            throw new IllegalArgumentException("Essa senha é muito comum. Escolha outra");
        }
        if (email != null && !email.isBlank()) {
            String parteLocal = email.toLowerCase(Locale.ROOT).split("@")[0];
            if (minuscula.equals(email.toLowerCase(Locale.ROOT)) || (parteLocal.length() >= 4 && minuscula.equals(parteLocal))) {
                throw new IllegalArgumentException("A senha não pode ser igual ao e-mail");
            }
        }
    }
}
