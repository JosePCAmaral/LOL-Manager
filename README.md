# LOL Manager

Ambiente full stack com NestJS no backend, Angular no frontend, MySQL no banco e Docker para subir tudo localmente.

## Portas

- Backend: `http://localhost:3002`
- Frontend: `http://localhost:40202`
- MySQL: `localhost:3309`

## Como subir

1. Execute `docker compose up --build` na raiz do projeto.
2. Acesse o frontend em `http://localhost:40202`.
3. A API fica em `http://localhost:3002/api/health` e `http://localhost:3002/api/db/health`.

## Credenciais de desenvolvimento

- Usuário: `lolmanager`
- Senha: `lolmanager`
- Banco: `lol_manager`

O backend se conecta ao MySQL pelo nome do serviço `mysql` dentro do Docker.

