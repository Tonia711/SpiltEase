import { describe, it, vi, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../../pages/LoginPage";
import { AuthContext } from "../../contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLoginPage() {
  render(
    <BrowserRouter>
      <AuthContext.Provider value={{ login: mockLogin }}>
        <LoginPage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/enter email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
  });

  it("calls login and navigates on success", async () => {
    mockLogin.mockResolvedValueOnce({ ok: true });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter password/i);
    const form = screen.getByTestId("login-form");

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows field-specific error if provided", async () => {
    mockLogin.mockResolvedValueOnce({
      ok: false,
      field: "email",
      error: "Invalid email format",
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter password/i);
    const form = screen.getByTestId("login-form");

    await userEvent.type(emailInput, "bademail");
    await userEvent.type(passwordInput, "123");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("bademail", "123");
    });

    const error = await screen.findByTestId("email-error");
    expect(error).toHaveTextContent("Invalid email format");
  });

  it("shows general error if login fails without field", async () => {
    mockLogin.mockResolvedValueOnce({
      ok: false,
      error: "Something went wrong",
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/enter email address/i);
    const passwordInput = screen.getByPlaceholderText(/enter password/i);
    const form = screen.getByTestId("login-form");

    await userEvent.type(emailInput, "user@example.com");
    await userEvent.type(passwordInput, "wrongpass");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "wrongpass");
    });

    const error = await screen.findByTestId("general-error");
    expect(error).toHaveTextContent("Something went wrong");
  });
});
