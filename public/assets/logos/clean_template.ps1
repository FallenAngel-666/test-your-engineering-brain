Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\certificate-template.jpg"
$outputPath = "C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\certificate-clean-template.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)
Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"

# Sample background color around name area
$c = $bmp.GetPixel(150, 420)
Write-Host "Sampled background color: R=$($c.R), G=$($c.G), B=$($c.B)"

# Clone into editable bitmap
$clone = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g = [System.Drawing.Graphics]::FromImage($clone)
$g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)

# In the original image:
# Line is at y = 472. It goes from x = 65 to x = 720.
# '< NAME >' text is between y = 430 and y = 468, x = 270 to x = 490.
# The old description text is between y = 530 and y = 590, x = 80 to x = 650.
# Let's clone background texture patches or fill with sampled background brush.
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($c.R, $c.G, $c.B))

# Cover '< NAME >'
$g.FillRectangle($bgBrush, 260, 425, 250, 44)

# Cover old description text
$g.FillRectangle($bgBrush, 70, 530, 600, 68)

$g.Dispose()
$bmp.Dispose()

$clone.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$clone.Dispose()
Write-Host "Saved cleaned template to $outputPath"
