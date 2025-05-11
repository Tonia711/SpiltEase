import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ProfilePage from "../pages/ProfilePage";
import { AuthContext } from "../contexts/AuthContext";
import api from "../utils/api";

// mock api
vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
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

describe("ProfilePage", () => {
  const mockUser = {
    _id: "123",
    userName: "JohnDoe",
    email: "john@example.com",
    avatarUrl: "/avatars/default.png",
    avatarId: "a1",
  };

  const mockUpdateUser = vi.fn();
  const mockLogout = vi.fn();

  const setup = (user = mockUser) =>
    render(
      <AuthContext.Provider
        value={{ user, updateUser: mockUpdateUser, logout: mockLogout }}
      >
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login if user is not logged in", () => {
    setup(null);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("renders user info", () => {
    setup();
    expect(screen.getByText("JohnDoe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("switches to editing mode when Edit is clicked", async () => {
    setup();
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByDisplayValue("JohnDoe")).toBeInTheDocument();
  });

  it("saves updated username", async () => {
    api.put.mockResolvedValueOnce({
      data: { ...mockUser, userName: "UpdatedName" },
    });
    setup();

    fireEvent.click(screen.getByText("Edit"));

    const input = screen.getByDisplayValue("JohnDoe");
    await userEvent.clear(input);
    await userEvent.type(input, "UpdatedName");

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/users/me", {
        userName: "UpdatedName",
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({ userName: "UpdatedName" })
      );
    });
  });

  it("opens avatar modal", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    setup();

    fireEvent.click(screen.getByText("Edit"));
    const cameraButton = screen.getByRole("button", { name: "" }); // the camera icon
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText("📷")).toBeInTheDocument(); // modal center icon
    });
  });

  it("logs out when Logout is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Logout"));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
