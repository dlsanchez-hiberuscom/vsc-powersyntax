# Quickstart - Spec 268 Early spec hygiene (B233)

```powershell
Get-ChildItem specs -Directory |
  Where-Object { $_.Name -match '^(00[1-9]|01[0-9]|020)-' } |
  Sort-Object Name |
  ForEach-Object {
    $files = Get-ChildItem $_.FullName -File | Select-Object -ExpandProperty Name
    [pscustomobject]@{ Spec = $_.Name; Files = ($files -join ', ') }
  } | Format-Table -AutoSize
```