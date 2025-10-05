# Executa os testes com o plugin e gera HTML automaticamente
npx cypress run --reporter cypress-mochawesome-reporter --reporter-options "reportDir=reports,json=true,html=true,overwrite=false"

# Aguarda a criação do HTML
Start-Sleep -Seconds 2

# Cria pasta fixa para o relatório
New-Item -ItemType Directory -Path "reports/html" -Force

# Localiza o HTML mais recente gerado
$latestReport = Get-ChildItem -Path reports -Filter "index_*.html" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Move e renomeia para pasta fixa
if ($latestReport) {
    Move-Item $latestReport.FullName "reports/html/index.html" -Force
    Write-Host "✅ Relatório salvo em reports/html/index.html"
    Start-Process "reports/html/index.html"
} else {
    Write-Host "⚠️ Nenhum relatório HTML encontrado."
}