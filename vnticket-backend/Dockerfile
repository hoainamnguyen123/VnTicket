# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies (cached layer)
RUN mvn dependency:resolve -q

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -q

# Stage 2: Run (smaller image)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run with prod profile, limit memory for free tier
ENTRYPOINT ["java", "-Xmx256m", "-jar", "app.jar", "--spring.profiles.active=prod"]
