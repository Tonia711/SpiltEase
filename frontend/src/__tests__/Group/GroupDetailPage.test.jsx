import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import GroupDetailPage from "../../pages/GroupDetailPage.jsx";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../utils/api";

// Mock API
vi.mock("../../utils/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ groupId: "test-group-id" }),
    useNavigate: () => vi.fn(),
  };
});

describe("GroupDetailPage", () => {
  const mockGroupData = {
    _id: "test-group-id",
    groupName: "Test Group",
    startDate: "2025-05-01",
    joinCode: "ABC123",
    iconUrl: "groups/defaultIcon.jpg",
    members: [
      { _id: "1", userName: "Alice", isHidden: false },
      { _id: "2", userName: "Bob", isHidden: false },
    ],
  };

  const renderComponent = () =>
    render(
      <AuthContext.Provider value={{ token: "mock-token" }}>
        <BrowserRouter>
          <GroupDetailPage />
        </BrowserRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockGroupData });
  });

  it("renders group info correctly", async () => {
    renderComponent();

    expect(screen.getByText("Loading group details...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Group")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2025-05-01")).toBeInTheDocument();
      expect(screen.getByText("Invite Code")).toBeInTheDocument();
    });
  });

  it("displays members list", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows toast when clicking copy", async () => {
    // Mock clipboard API
    const clipboardMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardMock,
      },
    });

    renderComponent();

    await waitFor(() => screen.getByText("ABC123"));

    const copyIcon = screen.getByTestId("copy-icon");
    fireEvent.click(copyIcon);

    expect(clipboardMock).toHaveBeenCalledWith("ABC123");

    await waitFor(() => {
      expect(screen.getByText("Copied to clipboard!")).toBeInTheDocument();
    });
  });

  it("allows entering edit mode and saving", async () => {
    renderComponent();

    await waitFor(() => screen.getByText("Edit"));

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByDisplayValue("Test Group")).not.toHaveAttribute(
      "readOnly"
    );

    fireEvent.change(screen.getByDisplayValue("Test Group"), {
      target: { value: "New Group Name" },
    });

    api.put.mockResolvedValueOnce({
      data: { ...mockGroupData, groupName: "New Group Name" },
    });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        "/groups/test-group-id/update",
        expect.objectContaining({ groupName: "New Group Name" }),
        expect.anything()
      )
    );
  });

  it("adds a new member in editing mode", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Edit"));

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Add new member"));

    const input = screen.getByPlaceholderText("Enter name");
    fireEvent.change(input, { target: { value: "Charlie" } });
    fireEvent.click(screen.getByText("✔"));

    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });
});
