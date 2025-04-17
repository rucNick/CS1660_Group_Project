# Stage 1: Build the application using Maven
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /build

# Copy only the pom.xml first to leverage cached dependency downloads
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source files
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-focal

# Create a specific non-root user for security
RUN groupadd -r javauser && useradd -r -g javauser javauser

# Create the app directory and set permissions
RUN mkdir -p /home/javauser/app
WORKDIR /home/javauser/app

# Copy the JAR file from the build stage
COPY --from=build /build/target/*.jar app.jar

# Set ownership to non-root user
RUN chown -R javauser:javauser /home/javauser

# Use the non-root user
USER javauser

# Explicitly expose port 8080
EXPOSE 8080

# Set the PORT environment variable (Cloud Run will also pass PORT)
ENV PORT=8080

# Use an exec wrapper to ensure proper signal handling and correct port binding
CMD ["sh", "-c", "java -Dserver.port=${PORT} -Dserver.address=0.0.0.0 -jar app.jar"]