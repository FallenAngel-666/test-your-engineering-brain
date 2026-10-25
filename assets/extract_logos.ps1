Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\certificate-template.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)

# 1. Dr. M.G.R. Crest (Top Left)
# x ~ 40 to 140, y ~ 35 to 185
$mgrRect = New-Object System.Drawing.Rectangle(40, 35, 105, 150)
$mgrBmp = $bmp.Clone($mgrRect, $bmp.PixelFormat)
$mgrBmp.Save("C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\mgr-crest.png", [System.Drawing.Imaging.ImageFormat]::Png)
$mgrBmp.Dispose()

# 2. IEI Golden Emblem (Right side)
# The round seal: x ~ 700 to 980, y ~ 60 to 420
$ieiRect = New-Object System.Drawing.Rectangle(700, 60, 280, 360)
$ieiBmp = $bmp.Clone($ieiRect, $bmp.PixelFormat)
$ieiBmp.Save("C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\iei-emblem.png", [System.Drawing.Imaging.ImageFormat]::Png)
$ieiBmp.Dispose()

# 3. NAAC A+ seal
$naacRect = New-Object System.Drawing.Rectangle(580, 40, 95, 120)
$naacBmp = $bmp.Clone($naacRect, $bmp.PixelFormat)
$naacBmp.Save("C:\Users\Sripriyan\.gemini\antigravity\scratch\test-your-engineering-brain\assets\naac-seal.png", [System.Drawing.Imaging.ImageFormat]::Png)
$naacBmp.Dispose()

$bmp.Dispose()
Write-Host "Logos extracted successfully."
