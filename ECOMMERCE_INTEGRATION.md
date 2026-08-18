# InduCore E-Commerce Integration API Documentation

This guide provides instructions and request/response specifications for integrating the separate **AI Product Intelligence Application** with the customer-facing InduCore industrial e-commerce catalog.

---

### E-COMMERCE PRODUCT UPDATE API:
`POST http://localhost:5000/api/integration/product-update`

---

## 1. Endpoints Summary

### A. Product Update Endpoint
*   **URL**: `http://localhost:5000/api/integration/product-update`
*   **Method**: `POST`
*   **Content-Type**: `application/json`
*   **Purpose**: Update specifications, details, or documentation versions of a specific component after verification and manual approval.

### B. Health Check
*   **URL**: `http://localhost:5000/api/integration/health`
*   **Method**: `GET`
*   **Purpose**: Check service availability.

### C. Request Status Check
*   **URL**: `http://localhost:5000/api/integration/product-update/status/:requestId`
*   **Method**: `GET`
*   **Purpose**: Track the state (`pending`, `applied`, `rejected`, `failed`) of a specific request ID.

---

## 2. Product Update Payload Format (POST)

The API accepts JSON payloads with the following structure:

```json
{
  "requestId": "upd-2026-00123",
  "productId": "M-101",
  "modelNumber": "M-101",
  "expectedVersion": 1,
  "newVersion": 2,
  "updates": {
    "power": "7.5 kW",
    "speed": "1460 RPM",
    "weight": "54 kg"
  },
  "source": {
    "documentName": "technical_spec_2026.pdf",
    "documentVersion": "2.0"
  },
  "approval": {
    "approved": true,
    "approvedBy": "admin@example.com",
    "approvalId": "APP-10023"
  }
}
```

### Key Rules and Protections
1.  **Approval Is Mandatory**: The request is rejected if `approval.approved !== true`.
2.  **Stale Update Protection**: The `expectedVersion` is compared with the current product version in the database. If they do not match, the update is rejected as a version conflict (Conflict 409).
3.  **Idempotency**: If the exact same `requestId` is submitted multiple times, the API returns the cached successful response without executing duplicate database writes.
4.  **Partial Updates**: The API updates only fields specified in the `updates` object. It maps keys case-insensitively (e.g. `"speed"` maps to `"Speed"` in specifications).
5.  **Technical Datasheet Matching**: If the `source.documentVersion` is provided, the product's associated `Technical Datasheet` document metadata is automatically updated with the new version and current date.

---

## 3. Product Matching Algorithm

To prevent speculative matching errors, the API identifies target components in this order:
1.  **Exact Product ID / SKU**: Looks up the database for `product.id === productId`.
2.  **Exact Model Number / Part Number**: Looks up the database for `product.model === modelNumber` or `product.specifications["Model"] === modelNumber`.

*If the target cannot be found, the API returns `404 Not Found`. If multiple matching products are identified (ambiguous criteria), the API aborts the update and returns `409 Conflict` along with the list of candidate products.*

---

## 4. API Response Formats

### A. Success Response (200 OK)
```json
{
  "success": true,
  "status": "updated",
  "message": "Product updated successfully.",
  "requestId": "upd-2026-00123",
  "productId": "M-101",
  "modelNumber": "M-101",
  "previousVersion": 1,
  "newVersion": 2,
  "changedFields": [
    "power",
    "speed",
    "weight",
    "documentVersion"
  ],
  "updatedProduct": {
    "id": "M-101",
    "model": "M-101",
    "name": "Premium High Efficiency Motor",
    "category": "Motors",
    "description": "...",
    "version": 2,
    "lastUpdated": "18 Aug 2026",
    "specifications": {
      "Power": "7.5 kW",
      "Voltage": "415 V",
      "Speed": "1460 RPM",
      "Weight": "54 kg"
    },
    "documents": [
      {
        "id": "DOC-M-101-DS",
        "productId": "M-101",
        "type": "Technical Datasheet",
        "version": "2.0",
        "publishDate": "18 Aug 2026"
      }
    ]
  }
}
```

### B. Missing Human Approval Error (403 Forbidden)
```json
{
  "success": false,
  "status": "approval_required",
  "message": "Human approval is required before product data can be updated."
}
```

### C. Stale Version Conflict Error (409 Conflict)
```json
{
  "success": false,
  "status": "version_conflict",
  "message": "Product has already been updated. Refresh product data before applying this change.",
  "currentVersion": 2
}
```

### D. Ambiguous Matching Candidates Error (409 Conflict)
```json
{
  "success": false,
  "status": "ambiguous_product",
  "message": "Multiple possible products found. No update applied.",
  "candidates": [
    {
      "productId": "M-450",
      "modelNumber": "XYZ-450",
      "confidence": 0.9
    },
    {
      "productId": "M-450A",
      "modelNumber": "XYZ-450A",
      "confidence": 0.9
    }
  ]
}
```

---

## 5. Integration Code Samples

### A. Example Curl Command
```bash
curl -X POST http://localhost:5000/api/integration/product-update \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "upd-2026-00123",
    "productId": "M-101",
    "modelNumber": "M-101",
    "expectedVersion": 1,
    "newVersion": 2,
    "updates": {
      "power": "7.5 kW",
      "speed": "1460 RPM",
      "weight": "54 kg"
    },
    "source": {
      "documentName": "technical_spec_2026.pdf",
      "documentVersion": "2.0"
    },
    "approval": {
      "approved": true,
      "approvedBy": "admin@example.com",
      "approvalId": "APP-10023"
    }
  }'
```

### B. Example JavaScript Fetch Request
```javascript
const requestPayload = {
  requestId: "upd-2026-00123",
  productId: "M-101",
  modelNumber: "M-101",
  expectedVersion: 1,
  newVersion: 2,
  updates: {
    power: "7.5 kW",
    speed: "1460 RPM",
    weight: "54 kg"
  },
  source: {
    documentName: "technical_spec_2026.pdf",
    documentVersion: "2.0"
  },
  approval: {
    approved: true,
    approvedBy: "admin@example.com",
    approvalId: "APP-10023"
  }
};

fetch("http://localhost:5000/api/integration/product-update", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(requestPayload)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log("Product updated successfully! New version:", data.newVersion);
  } else {
    console.error("Update rejected:", data.message, "Reason code:", data.status);
  }
})
.catch(err => console.error("Network error connecting to InduCore:", err));
```
