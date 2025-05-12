import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NewGroupPage from "../../pages/NewGroupPage";
import { AuthContext } from "../../contexts/AuthContext";
import api from "../../utils/api";

// Mock api
vi.mock("../../utils/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock navigate
const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("NewGroupPage", () => {
  const mockUser = {
    id: "123",
    userName: "TestUser",
  };

  const setup = () =>
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <NewGroupPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with current user as default member", () => {
    setup();
    expect(screen.getByText("TestUser (You)")).toBeInTheDocument();
  });

  it("allows adding a new virtual member", async () => {
    setup();
    const addBtn = screen.getByText("Add another member");
    fireEvent.click(addBtn);

    const input = screen.getByPlaceholderText("Enter member name");
    await userEvent.type(input, "Alice");

    const confirmBtn = screen.getByText("✔");
    fireEvent.click(confirmBtn);

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("prevents adding a duplicate member", async () => {
    setup();
    fireEvent.click(screen.getByText("Add another member"));

    const input = screen.getByPlaceholderText("Enter member name");
    await userEvent.type(input, "TestUser");

    fireEvent.click(screen.getByText("✔"));

    expect(screen.getByText("Already in the group")).toBeInTheDocument();
  });

  it("removes a non-creator member", async () => {
    setup();

    // Add one new member
    fireEvent.click(screen.getByText("Add another member"));
    const input = screen.getByPlaceholderText("Enter member name");
    await userEvent.type(input, "Bob");
    fireEvent.click(screen.getByText("✔"));

    const removeBtn = screen.getAllByText("✖")[0]; // Should be the non-creator's button
    fireEvent.click(removeBtn);

    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("submits the form and redirects on success", async () => {
    api.post.mockResolvedValueOnce({ data: { groupId: "abc" } });

    await act(async () => {
      setup();
    });

    const form = screen.getByTestId("createForm");
    const groupNameInput = screen.getByPlaceholderText("Enter group name");
    const startDateInput = screen.getByLabelText("Start Date");

    await act(async () => {
      await userEvent.type(groupNameInput, "My Group");
      await userEvent.type(startDateInput, "2025-05-11");
    });

    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/groups/create",
        expect.any(Object)
      );
    });

    expect(screen.getByText("Group created successfully!")).toBeInTheDocument();

    // Wait for the navigation timeout
    await waitFor(
      () => {
        expect(mockedNavigate).toHaveBeenCalledWith("/");
      },
      { timeout: 2000 }
    );
  });
});
