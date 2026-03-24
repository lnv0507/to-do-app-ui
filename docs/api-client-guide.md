# API Client Guide

## Import

```ts
import { apiClient } from "@/lib/api/api-client"
```

---

## Những gì apiClient tự lo

| | |
|---|---|
| **Bearer Token** | Tự đọc `localStorage["auth-storage"]` → gắn `Authorization: Bearer <token>` |
| **Cookies** | `withCredentials: true` → browser tự gửi `refreshToken`, `device_id` |
| **Base URL** | `NEXT_PUBLIC_API_URL` hoặc `http://localhost:8080` |
| **Error** | Tự throw `AxiosError` nếu status ≥ 400 |

> ❌ Không cần set `Authorization`, `credentials: "include"`, hay đọc store thủ công.

---

## Cách dùng

### GET — object
```ts
const { data } = await apiClient.get<MyType>("/api/resource")
```

### GET — array
```ts
const { data } = await apiClient.get<MyType[]>("/api/resources")
const list = Array.isArray(data) ? data : []
```

### POST
```ts
const { data } = await apiClient.post<MyType>("/api/resources", payload)
```

### PUT
```ts
const { data } = await apiClient.put<MyType>(`/api/resources/${id}`, payload)
```

### DELETE
```ts
await apiClient.delete(`/api/resources/${id}`)
```

### Upload file
```ts
const formData = new FormData()
formData.append("file", file)

const { data } = await apiClient.post<{ imageUrl: string }>(
  `/api/resources/${id}/image`,
  formData,
  {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded / (e.total ?? 1)) * 100)
      onProgress?.(percent)
    },
  }
)
```

### Handle 204 No Content
```ts
const response = await apiClient.get<MyType[]>("/api/endpoint", {
  validateStatus: (s) => s === 200 || s === 204,
})
if (response.status === 204 || !Array.isArray(response.data)) return []
return response.data
```

---

## Bắt lỗi

```ts
try {
  const { data } = await apiClient.post("/api/resource", payload)
} catch (error: any) {
  const message = error.response?.data?.message || "Something went wrong"
  const status = error.response?.status // 401, 403, 404...
}
```

---

## Cấu trúc file (convention)

```
lib/
├── api/
│   └── api-client.ts       ← Axios instance + interceptors (không sửa)
├── services/
│   └── auth-service.ts     ← Auth endpoints
└── todo-api.ts             ← Task endpoints
```

- Mỗi domain có 1 file API riêng
- Luôn **transform** response về kiểu frontend trước khi return
- Không để raw backend type leak ra ngoài
