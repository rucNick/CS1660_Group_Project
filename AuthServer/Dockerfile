# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy only the pom.xml first to leverage cached dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using a lightweight JDK image
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the generated jar file from the build stage.
# Adjust the wildcard if your jar file has a different naming pattern.
COPY --from=build /app/target/*.jar app.jar

# Expose the port your Spring Boot application listens on (default is 8080)
EXPOSE 8080

# Run the JAR file
ENTRYPOINT ["java", "-jar", "app.jar"]
