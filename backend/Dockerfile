FROM golang:1.19-alpine AS builder

WORKDIR /app

# Install build dependencies for CGO
RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -o eventposter ./cmd/server

# Second stage: minimal runtime
FROM alpine:3.16

RUN apk add --no-cache libc6-compat ca-certificates sqlite

WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /data

# Copy the binary
COPY --from=builder /app/eventposter .

# Set environment variables
ENV DB_PATH=/data/event_poster.db
ENV PORT=8080

# Expose the service port
EXPOSE 8080

# Run the service
CMD ["./eventposter"] 