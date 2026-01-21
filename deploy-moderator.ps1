#!/usr/bin/env pwsh

<#
.SYNOPSIS
Smart deployment script for CueFinderModerator - only rebuilds when changes are detected in the folder

.DESCRIPTION
Monitors CueFinderModerator folder for changes and rebuilds/redeploys only when needed.
Tracks the last build hash to detect changes efficiently.

.EXAMPLE
./deploy-moderator.ps1

.PARAMETER Force
Force rebuild even if no changes detected

.PARAMETER NoBuild
Skip build and just restart container
#>

param(
    [switch]$Force,
    [switch]$NoBuild,
    [string]$StateFile = ".moderator-deploy-state"
)

# Configuration
$ModerationFolder = "CueFinderModerator"
$ContainerName = "cuefinder-moderator"
$ImageName = "cuefinder-moderator"
$LogFile = "moderator-deploy.log"

# Helper function to log messages
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

# Helper function to calculate folder hash
function Get-FolderHash {
    param([string]$Path)
    
    $files = Get-ChildItem -Path $Path -Recurse -File `
        -Exclude "bin", "obj", ".vs", "*.dll", "*.pdb" | 
        Sort-Object FullName
    
    $hash = @()
    foreach ($file in $files) {
        $fileHash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
        $hash += "$($file.FullName):$fileHash"
    }
    
    $combinedHash = $hash -join "|"
    return (Get-StringHash $combinedHash)
}

# Helper function to hash a string
function Get-StringHash {
    param([string]$String)
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    $hash = $hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($String))
    return [System.BitConverter]::ToString($hash).Replace("-", "")
}

# Main deployment logic
try {
    Write-Log "========== CueFinderModerator Deployment Started =========="
    Write-Log "Checking for changes in $ModerationFolder folder..."
    
    # Calculate current folder hash
    $currentHash = Get-FolderHash $ModerationFolder
    Write-Log "Current folder hash: $currentHash"
    
    # Read previous hash if it exists
    $previousHash = ""
    if (Test-Path $StateFile) {
        $previousHash = Get-Content $StateFile
        Write-Log "Previous folder hash: $previousHash"
    } else {
        Write-Log "State file not found - first deployment"
    }
    
    # Check if rebuild is needed
    $needsRebuild = $Force -or ($currentHash -ne $previousHash)
    
    if ($needsRebuild -and -not $NoBuild) {
        Write-Log "Changes detected! Building new image..."
        Write-Log "Building Docker image: $ImageName"
        
        # Build the Docker image
        docker build -f "$ModerationFolder/Dockerfile" -t "${ImageName}:latest" .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "❌ Docker build failed!" "ERROR"
            exit 1
        }
        
        Write-Log "✅ Docker image built successfully"
        
        # Save current hash to state file
        $currentHash | Set-Content $StateFile
        Write-Log "Updated state file with new hash"
    } elseif ($NoBuild) {
        Write-Log "Skipping build (--NoBuild flag)"
    } else {
        Write-Log "✅ No changes detected - skipping rebuild"
    }
    
    # Stop and remove existing container if running
    Write-Log "Checking for existing container..."
    if (docker ps -a --format "table {{.Names}}" | Select-String -Pattern "^${ContainerName}$") {
        Write-Log "Stopping existing container: $ContainerName"
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
        Write-Log "✅ Container stopped and removed"
    }
    
    # Start the container using docker-compose
    Write-Log "Starting container with docker-compose..."
    docker-compose up -d $ContainerName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log "❌ Docker compose failed!" "ERROR"
        exit 1
    }
    
    Write-Log "✅ Container started"
    
    # Wait for container to be healthy
    Write-Log "Waiting for container to become healthy..."
    $maxRetries = 30
    $retryCount = 0
    
    while ($retryCount -lt $maxRetries) {
        $health = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if ($health -eq "healthy") {
            Write-Log "✅ Container is healthy!"
            break
        } elseif ($health -eq "unhealthy") {
            Write-Log "❌ Container is unhealthy!" "ERROR"
            docker logs $ContainerName
            exit 1
        }
        Write-Log "Waiting... (attempt $($retryCount + 1)/$maxRetries)"
        Start-Sleep -Seconds 1
        $retryCount++
    }
    
    if ($retryCount -eq $maxRetries) {
        Write-Log "⚠ Container health check timeout - checking logs..."
        docker logs $ContainerName
    }
    
    # Display final status
    Write-Log "========== Deployment Completed Successfully =========="
    Write-Log "Container Status:"
    docker ps -a --filter "name=$ContainerName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
} catch {
    Write-Log "❌ Deployment failed with exception: $_" "ERROR"
    Write-Log $_.ScriptStackTrace "ERROR"
    exit 1
}
