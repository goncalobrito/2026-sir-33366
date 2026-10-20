## 📬 Testes com Postman (Parte 2)

O ficheiro com a coleção de testes encontra-se guardado no repositório em:
👉 **`/tests/postman_collection.json`**

### Como importar e executar:
1. Abra o **Postman**.
2. Clique no botão **Import** (canto superior esquerdo).
3. Selecione o ficheiro em `/tests/postman_collection.json` ou importe o conteúdo JSON abaixo.
4. Para correr contra a API simulada: certifique-se de que o `json-server` está a correr em `localhost:3000`.
5. Para correr contra a API real: atualize a porta para `localhost:5000` ou use a URL de produção do Render.

<details>
<summary><b>Clique para expandir/ver o JSON da Coleção Postman</b></summary>

```json
{
	"info": {
		"_postman_id": "94e5168c-bdf4-4c00-b873-26a1a9368165",
		"name": "postman_collection",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
		"_exporter_id": "414713"
	},
	"item": [
		{
			"name": "obter alunos",
			"request": {
				"auth": {
					"type": "noauth"
				},
				"method": "GET",
				"header": [],
				"url": {
					"raw": "localhost:3000/alunos",
					"host": [
						"localhost"
					],
					"port": "3000",
					"path": [
						"alunos"
					]
				}
			},
			"response": []
		}
	]
}
```

</details>
