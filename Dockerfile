# One image, one process: Spring Boot serves the API and the built React app from the same origin.
# Build:  docker build -t not-from-here .
# Run:    docker run -d -p 80:8080 -e LLM_PROVIDER=plantnet -e PLANTNET_API_KEY=... -v nfh-data:/app/data -v nfh-cache:/app/cache not-from-here

# 1. Frontend: Vite build (tsc + vite build, same as `npm run build` in frontend/)
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2. Backend: the jar, with the frontend's dist copied into its static resources
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -B -DskipTests dependency:resolve dependency:resolve-plugins || true
COPY src src
COPY --from=web /web/dist src/main/resources/static
RUN ./mvnw -q -B -DskipTests package

# 3. Runtime: a JRE, a small heap (fits a 1 GB box), the database and the API cache on volumes
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/data /app/cache
VOLUME ["/app/data", "/app/cache"]
ENV LLM_PROVIDER=plantnet
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx384m", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-jar", "app.jar"]
