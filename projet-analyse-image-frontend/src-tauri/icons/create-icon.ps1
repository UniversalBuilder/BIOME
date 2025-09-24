# Create BIOME icon
Add-Type -AssemblyName System.Drawing

$outputPath = "$PSScriptRoot\icon.png"
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Fill with teal background (Avatar-inspired)
$g.Clear([System.Drawing.Color]::FromArgb(0, 150, 136))

# Add "B" text
$font = New-Object System.Drawing.Font('Arial', 140, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.DrawString('B', $font, $brush, 70, 50)

# Save the bitmap as PNG
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$g.Dispose()
$bmp.Dispose()

Write-Host "Icon created at $outputPath"
