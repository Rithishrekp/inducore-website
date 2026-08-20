import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Compare } from "./pages/Compare";
import { Quote } from "./pages/Quote";
import { About } from "./pages/About";
import { Industries } from "./pages/Industries";
import { Resources } from "./pages/Resources";
import { Contact } from "./pages/Contact";
import type { Product } from "./types";

// ---------------------------------------------------------------------------
// API configuration
// ---------------------------------------------------------------------------

function getApiBase(): string {
  const { hostname, port } = window.location;
  const isViteDevServer =
    (hostname === "localhost" || hostname === "127.0.0.1") &&
    port !== "5000" &&
    port !== "80" &&
    port !== "443" &&
    port !== "";
  return isViteDevServer ? "http://localhost:5000" : "";
}

// ---------------------------------------------------------------------------
// Catalog loading state
// ---------------------------------------------------------------------------

type CatalogState =
  | { status: "loading" }
  | { status: "ok"; products: Product[] }
  | { status: "error"; message: string; code?: number };

// ---------------------------------------------------------------------------
// StorageErrorBanner — shown when the API returns 503 / storage not configured
// ---------------------------------------------------------------------------

function StorageErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "20px 24px",
        margin: "24px auto",
        maxWidth: "760px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span style={{ fontSize: "22px" }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, color: "#991b1b", fontSize: "15px", marginBottom: "6px" }}>
            Product catalog is unavailable
          </div>
          <div style={{ color: "#7f1d1d", fontSize: "13px", lineHeight: 1.6 }}>
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#home");
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });

  // Fetch products from the production API — never silently falls back to stale static data
  const fetchProducts = useCallback(async () => {
    const apiBase = getApiBase();
    const url = `${apiBase}/api/products`;
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });

      if (!response.ok) {
        let errorMessage = `API returned HTTP ${response.status}.`;
        try {
          const errBody = await response.json();
          if (errBody?.message) errorMessage = errBody.message;
          if (errBody?.action) errorMessage += ` ${errBody.action}`;
        } catch (_) { /* ignore JSON parse errors */ }
        setCatalog({ status: "error", message: errorMessage, code: response.status });
        return;
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setCatalog({
          status: "error",
          message:
            "The product catalog API returned an empty response. " +
            "The persistent store may not have been seeded yet.",
        });
        return;
      }

      setCatalog({ status: "ok", products: data as Product[] });
    } catch (err) {
      // Network-level error (CORS, DNS, timeout, etc.)
      const msg = err instanceof Error ? err.message : String(err);
      setCatalog({
        status: "error",
        message:
          `Cannot reach the product catalog API (${url}). ` +
          `Network error: ${msg}. ` +
          "If running locally, ensure the API server is running on port 5000.",
      });
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "#home");
      window.scrollTo(0, 0);
      // Refresh data on navigation
      fetchProducts();
    };

    window.addEventListener("hashchange", handleHashChange);

    // Poll for live updates every 5 seconds
    const interval = setInterval(fetchProducts, 5000);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(interval);
    };
  }, [fetchProducts]);

  const handleNavigate = (hash: string) => {
    window.location.hash = hash;
  };

  const handleToggleCompare = (productId: string) => {
    setCompareProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) {
        alert("You can compare a maximum of 4 products at the same time.");
        return prev;
      }
      return [...prev, productId];
    });
  };

  const handleRemoveCompare = (productId: string) => {
    setCompareProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearCompare = () => setCompareProductIds([]);

  const handleSearchSelect = (productId: string) => {
    handleNavigate(`#products/${productId}`);
  };

  // Derive the product list from catalog state — never use static seed data at runtime
  const products: Product[] = catalog.status === "ok" ? catalog.products : [];

  const renderPage = () => {
    const hash = currentHash;

    // Show a clear loading state while the first API call is in flight
    if (catalog.status === "loading") {
      return (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading product catalog…</p>
          </div>
        </div>
      );
    }

    // Show a non-maskable error when the API fails
    if (catalog.status === "error") {
      const isProductPage =
        hash.startsWith("#products/") || hash.startsWith("#products");
      if (isProductPage) {
        return <StorageErrorBanner message={catalog.message} />;
      }
      // On non-product pages show the banner above normal content
      return (
        <>
          <StorageErrorBanner message={catalog.message} />
          {renderPageContent(hash, [])}
        </>
      );
    }

    return renderPageContent(hash, products);
  };

  const renderPageContent = (hash: string, productList: Product[]) => {
    if (hash === "" || hash === "#home") {
      return <Home onNavigate={handleNavigate} products={productList} />;
    }

    if (hash.startsWith("#products/")) {
      const parts = hash.split("/");
      const pId = parts[1];
      return (
        <ProductDetail
          productId={pId}
          products={productList}
          onNavigate={handleNavigate}
          compareProductIds={compareProductIds}
          onToggleCompare={handleToggleCompare}
        />
      );
    }

    if (hash.startsWith("#products")) {
      let initSearch = "";
      if (hash.includes("?")) {
        const queryStr = hash.split("?")[1];
        const params = new URLSearchParams(queryStr);
        initSearch = params.get("q") || "";
      }
      return (
        <Products
          onNavigate={handleNavigate}
          products={productList}
          compareProductIds={compareProductIds}
          onToggleCompare={handleToggleCompare}
          initialSearchQuery={initSearch}
          categoryFilter="All"
        />
      );
    }

    if (hash.startsWith("#category/")) {
      const parts = hash.split("/");
      const rawCat = parts[1];
      const formattedCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
      return (
        <Products
          onNavigate={handleNavigate}
          products={productList}
          compareProductIds={compareProductIds}
          onToggleCompare={handleToggleCompare}
          categoryFilter={formattedCat}
        />
      );
    }

    if (hash.startsWith("#compare")) {
      return (
        <Compare
          compareProductIds={compareProductIds}
          products={productList}
          onRemoveCompare={handleRemoveCompare}
          onClearCompare={handleClearCompare}
          onNavigate={handleNavigate}
        />
      );
    }

    if (hash.startsWith("#quote")) {
      return <Quote currentHash={hash} products={productList} onNavigate={handleNavigate} />;
    }

    if (hash === "#about") return <About />;
    if (hash === "#industries") {
      return <Industries onNavigate={handleNavigate} products={productList} />;
    }
    if (hash === "#resources") {
      return <Resources onNavigate={handleNavigate} products={productList} />;
    }
    if (hash === "#contact") return <Contact />;

    return <Home onNavigate={handleNavigate} products={productList} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        currentHash={currentHash}
        products={products}
        compareCount={compareProductIds.length}
        onNavigate={handleNavigate}
        onSearchSelect={handleSearchSelect}
      />
      <main className="flex-grow">{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
