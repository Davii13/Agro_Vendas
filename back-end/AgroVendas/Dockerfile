FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre
RUN groupadd --system agrovendas && useradd --system --gid agrovendas --no-create-home --shell /usr/sbin/nologin agrovendas
WORKDIR /app
COPY --from=build --chown=agrovendas:agrovendas /app/target/*.jar app.jar
# The application runs as an unprivileged user.
USER agrovendas
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
