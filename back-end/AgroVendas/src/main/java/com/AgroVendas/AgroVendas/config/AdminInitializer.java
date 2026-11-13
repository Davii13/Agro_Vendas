package com.AgroVendas.AgroVendas.config;

import com.AgroVendas.AgroVendas.model.Role;
import com.AgroVendas.AgroVendas.model.Usuario;
import com.AgroVendas.AgroVendas.repository.UsuarioRepository;
import com.AgroVendas.AgroVendas.service.UsuarioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Makes sure the system has an administrator. It only acts when there is no active ADMIN:
 * the account named by ADMIN_EMAIL is promoted, or created if ADMIN_PASSWORD is also set.
 * Nothing here is a fixed credential; both values come from the environment.
 */
@Component
public class AdminInitializer implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarioService;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminNome;

    public AdminInitializer(UsuarioRepository usuarioRepository,
                            UsuarioService usuarioService,
                            @Value("${app.admin.email:}") String adminEmail,
                            @Value("${app.admin.password:}") String adminPassword,
                            @Value("${app.admin.nome:Administrador}") String adminNome) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioService = usuarioService;
        this.adminEmail = adminEmail == null ? "" : adminEmail.trim();
        this.adminPassword = adminPassword == null ? "" : adminPassword;
        this.adminNome = adminNome;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean existeAdminAtivo = usuarioRepository.findAll().stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN && u.estaAtivo());
        if (existeAdminAtivo) {
            return;
        }
        if (adminEmail.isEmpty()) {
            logger.warn("Nenhum administrador ativo e ADMIN_EMAIL não definido: ninguém poderá gerenciar contas.");
            return;
        }

        usuarioRepository.findByEmail(adminEmail).ifPresentOrElse(usuario -> {
            usuario.setRole(Role.ADMIN);
            usuario.setAtivo(true);
            usuarioRepository.save(usuario);
            logger.info("Usuário {} promovido a administrador", usuario.getId());
        }, () -> {
            if (adminPassword.isEmpty()) {
                logger.warn("ADMIN_EMAIL não corresponde a nenhum usuário e ADMIN_PASSWORD não foi definida.");
                return;
            }
            Usuario criado = usuarioService.criarUsuario(adminEmail, adminPassword, adminNome, Role.ADMIN);
            logger.info("Administrador {} criado", criado.getId());
        });
    }
}
