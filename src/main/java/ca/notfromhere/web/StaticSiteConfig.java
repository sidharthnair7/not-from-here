package ca.notfromhere.web;

import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.server.servlet.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The hosted copy serves the built React app from the jar (src/main/resources/static, copied in by the Dockerfile).
 * Tomcat does not know the PWA manifest's extension, so it is registered here; without it Chrome sees
 * application/octet-stream and refuses to treat the site as installable.
 */
@Configuration
public class StaticSiteConfig {

    @Bean
    WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> pwaMimeTypes() {
        return factory -> {
            MimeMappings mappings = new MimeMappings(MimeMappings.DEFAULT);
            mappings.add("webmanifest", "application/manifest+json");
            factory.setMimeMappings(mappings);
        };
    }
}
