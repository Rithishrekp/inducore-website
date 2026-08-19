import { useState, useEffect } from "react";
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
import { PRODUCTS } from "./data/products";
import type { Product } from "./types";

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#home");
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  
  // Initialize with initial catalog state
  const [products, setProducts] = useState<Product[]>(() => {
    return PRODUCTS.map((p) => ({
      ...p,
      version: p.version || 1,
      lastUpdated: p.lastUpdated || "18 Aug 2026",
    }));
  });

  // Fetch updated catalog dynamically from API
  const fetchProducts = async () => {
    try {
      const isViteLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiUrl = isViteLocal && window.location.port !== "5000"
        ? "http://localhost:5000/api/products"
        : "/api/products";

      const response = await fetch(apiUrl, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      }
    } catch (err) {
      console.warn("Sync: API offline. Using current product state fallback.", err);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || "#home");
      window.scrollTo(0, 0);
      fetchProducts();
    };

    window.addEventListener("hashchange", handleHashChange);

    // Periodically poll for newly published specifications
    const interval = setInterval(fetchProducts, 4000);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(interval);
    };
  }, []);

  const handleNavigate = (hash: string) => {
    window.location.hash = hash;
  };

  const handleToggleCompare = (productId: string) => {
    setCompareProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        if (prev.length >= 4) {
          alert("You can compare a maximum of 4 products at the same time.");
          return prev;
        }
        return [...prev, productId];
      }
    });
  };

  const handleRemoveCompare = (productId: string) => {
    setCompareProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleClearCompare = () => {
    setCompareProductIds([]);
  };

  const handleSearchSelect = (productId: string) => {
    handleNavigate(`#products/${productId}`);
  };

  const renderPage = () => {
    const hash = currentHash;

    if (hash === "" || hash === "#home") {
      return <Home onNavigate={handleNavigate} products={products} />;
    }

    if (hash.startsWith("#products/")) {
      const parts = hash.split("/");
      const pId = parts[1];
      return (
        <ProductDetail
          productId={pId}
          products={products}
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
          products={products}
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
          products={products}
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
          products={products}
          onRemoveCompare={handleRemoveCompare}
          onClearCompare={handleClearCompare}
          onNavigate={handleNavigate}
        />
      );
    }

    if (hash.startsWith("#quote")) {
      return <Quote currentHash={hash} products={products} onNavigate={handleNavigate} />;
    }

    if (hash === "#about") {
      return <About />;
    }

    if (hash === "#industries") {
      return <Industries onNavigate={handleNavigate} products={products} />;
    }

    if (hash === "#resources") {
      return <Resources onNavigate={handleNavigate} products={products} />;
    }

    if (hash === "#contact") {
      return <Contact />;
    }

    return <Home onNavigate={handleNavigate} products={products} />;
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
