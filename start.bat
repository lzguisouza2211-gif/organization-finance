@echo off
title Organizacao Financeira
color 0A
echo.
echo  ================================================
echo    ORGANIZACAO FINANCEIRA PESSOAL
echo    (modo local — dados no Supabase cloud)
echo  ================================================
echo.

set "ROOT=%~dp0"

if not exist "%ROOT%frontend\.env.local" (
    echo  [AVISO] Arquivo frontend\.env.local nao encontrado!
    echo  Copie o arquivo .env.example para .env.local e
    echo  preencha com as credenciais do seu projeto Supabase.
    echo.
    pause
    exit /b 1
)

echo  Verificando dependencias...
cd /d "%ROOT%frontend"
if not exist node_modules (
    echo  Instalando... (primeira vez, aguarde)
    call npm install
)
echo  OK
echo.
echo  Iniciando frontend em http://localhost:5173
echo  Pressione Ctrl+C para encerrar.
echo.
npm run dev
