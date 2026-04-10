package com.vnticket.config;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.jedis.JedisClientConfiguration;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;

@Configuration
public class RedisConfig {

    /**
     * Tạo JedisConnectionFactory bean với connection pool.
     *
     * @param redisProperties đọc tự động từ application.yml (spring.data.redis.*)
     * @return JedisConnectionFactory có pool
     */
    @Bean
    public JedisConnectionFactory jedisConnectionFactory(RedisProperties redisProperties) {

        // ── 1. Cấu hình Pool ──────────────────────────────────────
        // GenericObjectPoolConfig quản lý vòng đời của các connection trong pool
        GenericObjectPoolConfig<?> poolConfig = new GenericObjectPoolConfig<>();
        poolConfig.setMaxTotal(10);       // Tối đa 10 connections đồng thời
        poolConfig.setMaxIdle(5);         // Tối đa 5 connections rảnh (idle) trong pool
        poolConfig.setMinIdle(1);         // Luôn giữ tối thiểu 1 connection sẵn sàng
        poolConfig.setTestOnBorrow(true); // Kiểm tra connection còn sống trước khi mượn

        // ── 2. Cấu hình Redis Server ──────────────────────────────
        // Đọc host và port từ application.yml
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setHostName(redisProperties.getHost());
        redisConfig.setPort(redisProperties.getPort());

        // Nếu Redis có password, set password
        if (redisProperties.getPassword() != null && !redisProperties.getPassword().isEmpty()) {
            redisConfig.setPassword(redisProperties.getPassword());
        }

        // ── 3. Tạo Jedis Client với Pool ──────────────────────────
        JedisClientConfiguration clientConfig = JedisClientConfiguration.builder()
                .usePooling()                    // Bật connection pooling
                .poolConfig(poolConfig)           // Gắn pool config ở bước 1
                .build();

        return new JedisConnectionFactory(redisConfig, clientConfig);
    }

    @Bean
    public CacheManager cacheManager(JedisConnectionFactory jedisConnectionFactory) {
        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig();
        return RedisCacheManager.builder(jedisConnectionFactory)
                .cacheDefaults(cacheConfig)
                .build();
    }
}
