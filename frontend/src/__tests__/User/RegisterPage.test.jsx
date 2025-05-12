import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import RegisterPage from "../../pages/RegisterPage";
import { AuthContext } from "../../contexts/AuthContext";

vi.mock("../../utils/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegisterPage", () => {
  const mockRegister = vi.fn();
  const setup = () =>
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all input fields", () => {
    setup();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Minimum 6 characters")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    setup();
    await userEvent.type(
      screen.getByPlaceholderText("Minimum 6 characters"),
      "abcdef"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "abc123"
    );

    expect(
      await screen.findByText("Passwords do not match")
    ).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    setup();
    await userEvent.type(
      screen.getByPlaceholderText("Enter email"),
      "invalid-email"
    );

    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });
  });

  it("submits and redirects on successful registration", async () => {
    mockRegister.mockResolvedValueOnce({ ok: true });
    setup();

    await userEvent.type(
      screen.getByPlaceholderText("Enter username"),
      "newuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter email"),
      "user@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Minimum 6 characters"),
      "abcdef"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "abcdef"
    );

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        userName: "newuser",
        email: "user@example.com",
        password: "abcdef",
        confirmPassword: "abcdef",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("displays error when registration fails with field-specific error", async () => {
    mockRegister.mockResolvedValueOnce({
      ok: false,
      field: "email",
      error: "Email already taken",
    });

    setup();

    await userEvent.type(
      screen.getByPlaceholderText("Enter username"),
      "newuser"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter email"),
      "user@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Minimum 6 characters"),
      "abcdef"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "abcdef"
    );

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Email already taken")).toBeInTheDocument();
    });
  });
});
