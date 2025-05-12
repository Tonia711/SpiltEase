import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import HomePage from "../pages/HomePage";
import { AuthContext } from "../contexts/AuthContext";

vi.mock("../components/GroupList", () => ({
  default: () => <div>GroupListMock</div>,
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("HomePage", () => {
  const mockUser = {
    userName: "Luca",
    avatarUrl: "/avatars/custom.png",
    groupId: [],
  };

  const setup = () =>
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders avatar, username, and group list", () => {
    setup();
    expect(screen.getByAltText("avatar")).toBeInTheDocument();
    expect(screen.getByText("Luca")).toBeInTheDocument();
    expect(screen.getByText("GroupListMock")).toBeInTheDocument();
  });

  it("navigates to /profile when avatar is clicked", () => {
    setup();
    fireEvent.click(screen.getByAltText("avatar"));
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("toggles options when FAB is clicked", () => {
    setup();
    const fab = screen.getByRole("button", { name: "+" });

    expect(screen.queryByText("Create Group")).not.toBeInTheDocument();
    expect(screen.queryByText("Join Group")).not.toBeInTheDocument();

    fireEvent.click(fab);
    expect(screen.getByText("Create Group")).toBeInTheDocument();
    expect(screen.getByText("Join Group")).toBeInTheDocument();

    fireEvent.click(fab);
    expect(screen.queryByText("Create Group")).not.toBeInTheDocument();
    expect(screen.queryByText("Join Group")).not.toBeInTheDocument();
  });

  it("navigates to /create-group and /groups/join", () => {
    setup();

    fireEvent.click(screen.getByRole("button", { name: "+" }));

    fireEvent.click(screen.getByText("Create Group"));
    expect(mockNavigate).toHaveBeenCalledWith("/create-group");

    fireEvent.click(screen.getByText("Join Group"));
    expect(mockNavigate).toHaveBeenCalledWith("/groups/join");
  });
});
