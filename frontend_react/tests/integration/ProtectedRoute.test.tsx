import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/panel"]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <div>Panel privado</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute + router", () => {
  it("redirige a /login cuando no hay token de sesión", () => {
    renderApp();
    expect(screen.getByText("Pantalla de login")).toBeInTheDocument();
    expect(screen.queryByText("Panel privado")).not.toBeInTheDocument();
  });

  it("muestra el contenido protegido cuando hay token", () => {
    localStorage.setItem("smilelink_token", "jwt.de.prueba");
    renderApp();
    expect(screen.getByText("Panel privado")).toBeInTheDocument();
    expect(screen.queryByText("Pantalla de login")).not.toBeInTheDocument();
  });
});
