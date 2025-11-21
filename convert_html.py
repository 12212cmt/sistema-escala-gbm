#!/usr/bin/env python3
import re

# Read the HTML file
with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add API script before closing </head>
html = html.replace('</head>', '<script src="api.js"></script>\n</head>')

# Remove initializeData function content
html = re.sub(
    r'function initializeData\(\) \{[^}]+\}',
    'function initializeData() {\n  // Data is now managed by the server\n}',
    html,
    flags=re.DOTALL
)

# Convert handleLogin to async and use API
html = re.sub(
    r'function handleLogin\(\) \{',
    'async function handleLogin() {',
    html
)

html = re.sub(
    r'(function handleLogin.*?)\n  const users = JSON\.parse\(localStorage\.getItem\(\'escalas_users\'\)\);.*?if \(!user\) \{.*?return;.*?\}',
    r'\1\n  showLoading(true);\n  \n  try {\n    const user = await API.login(username, password);\n    if (!user) {\n      alert(\'Usuário ou senha inválidos, ou usuário desativado.\');\n      return;\n    }',
    html,
    flags=re.DOTALL
)

# Add finally block to handleLogin
html = re.sub(
    r'(async function handleLogin.*?setupInterface\(\);.*?loadMonthsDropdown\(\);)',
    r'\1\n  } catch (error) {\n    // Error already shown\n  } finally {\n    showLoading(false);\n  }',
    html,
    flags=re.DOTALL
)

# Replace localStorage.getItem with API calls - Users
html = re.sub(
    r'JSON\.parse\(localStorage\.getItem\(\'escalas_users\'\)\)',
    'await API.getUsers()',
    html
)

# Replace localStorage.getItem - Months
html = re.sub(
    r'JSON\.parse\(localStorage\.getItem\(\'escalas_months\'\)\)',
    'await API.getMonths()',
    html
)

# Replace localStorage.getItem - Shifts
html = re.sub(
    r'JSON\.parse\(localStorage\.getItem\(\'escalas_shifts\'\)\)',
    'await API.getShifts(currentMonthId)',
    html
)

# Replace localStorage.getItem - Reservations
html = re.sub(
    r'JSON\.parse\(localStorage\.getItem\(\'escalas_reservations\'\)\)',
    'await API.getReservations(currentMonthId)',
    html
)

# Replace localStorage.getItem - Settings
html = re.sub(
    r'JSON\.parse\(localStorage\.getItem\(\'escalas_settings\'\)\)',
    'await API.getSettings()',
    html
)

# Remove all localStorage.setItem calls
html = re.sub(
    r'localStorage\.setItem\([^;]+\);',
    '// Data saved via API',
    html
)

# Convert key functions to async
functions_to_async = [
    'loadMonthsDropdown',
    'loadSchedule',
    'createMonth',
    'toggleMonthActive',
    'deleteMonth',
    'handleSlotClick',
    'saveShiftCapacity',
    'loadUsersTable',
    'saveUser',
    'toggleUserStatus',
    'deleteUser',
    'loadSettings',
    'saveSettings',
    'exportToCSV',
    'loadDashboard',
    'loadDashboardMonths',
    'loadProfile',
    'loadProfileMonths',
    'loadProfileInfo'
]

for func in functions_to_async:
    html = re.sub(
        rf'function {func}\(',
        f'async function {func}(',
        html
    )

# Write the converted HTML
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ Conversão concluída!")
print("⚠️  IMPORTANTE: Revise o arquivo e ajuste manualmente onde necessário.")
