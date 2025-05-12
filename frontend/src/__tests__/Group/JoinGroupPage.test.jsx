import { describe, it, vi, beforeEach, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JoinGroupPage from "../../pages/JoinGroupPage";
import { AuthContext } from "../../contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";
import api from "../../utils/api";

// mock api
vi.mock("../../utils/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderWithContext(user) {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user }}>
        <JoinGroupPage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe("GroupJoinPage", () => {
  const user = { _id: "u123", userName: "Lucah" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error for empty invite code", async () => {
    renderWithContext(user);
    fireEvent.click(screen.getByText("Join"));
    expect(
      await screen.findByText("Please enter a 5-digit code.")
    ).toBeInTheDocument();
  });

  it("shows error for invalid code (404)", async () => {
    api.post.mockRejectedValueOnce({ response: { status: 404 } });
    renderWithContext(user);
    fireEvent.change(screen.getByPlaceholderText(/6-character/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Join"));
    expect(await screen.findByText("Wrong Code!")).toBeInTheDocument();
  });

  it("handles already joined and cannot rejoin", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        isAlreadyMember: true,
        canRejoin: false,
      },
    });
    renderWithContext(user);
    fireEvent.change(screen.getByPlaceholderText(/6-character/i), {
      target: { value: "ABCDE1" },
    });
    fireEvent.click(screen.getByText("Join"));
    expect(await screen.findByText("Already a member")).toBeInTheDocument();
  });

  it("shows rejoin option if already member and can rejoin", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        isAlreadyMember: true,
        canRejoin: true,
        group: {
          _id: "g123",
          groupName: "Test Group",
          members: [{ _id: "m1", userId: "u123", userName: "Lucah" }],
        },
      },
    });
    renderWithContext(user);
    fireEvent.change(screen.getByPlaceholderText(/6-character/i), {
      target: { value: "REJOIN" },
    });
    fireEvent.click(screen.getByText("Join"));
    expect(
      await screen.findByText(
        "You've been part of this group before. Would you like to rejoin?"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rejoin group/i })
    ).toBeInTheDocument();
  });

  it("shows member list and allows new join", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        isAlreadyMember: false,
        group: {
          _id: "g123",
          groupName: "Test Group",
          members: [
            { _id: "m1", userId: "u999", userName: "OtherUser" },
            { _id: "m2", userId: null, userName: "VirtualUser" },
          ],
        },
      },
    });
    renderWithContext(user);
    fireEvent.change(screen.getByPlaceholderText(/6-character/i), {
      target: { value: "JOINME" },
    });
    fireEvent.click(screen.getByText("Join"));

    expect(await screen.findByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("VirtualUser")).toBeInTheDocument();

    fireEvent.click(screen.getByText("VirtualUser"));
    expect(screen.getByText("Join")).not.toBeDisabled();

    fireEvent.click(screen.getByText(/Join as "Lucah"/i));
    expect(screen.getByText("Join")).not.toBeDisabled();
  });

  it("calls join API successfully", async () => {
    api.post
      .mockResolvedValueOnce({
        data: {
          isAlreadyMember: false,
          group: {
            _id: "g123",
            groupName: "Test Group",
            members: [],
          },
        },
      })
      .mockResolvedValueOnce({});

    renderWithContext(user);
    fireEvent.change(screen.getByPlaceholderText(/6-character/i), {
      target: { value: "NEW123" },
    });
    fireEvent.click(screen.getByText("Join"));
    await screen.findByText("Test Group");

    fireEvent.click(screen.getByText(/Join as "Lucah"/i));
    fireEvent.click(screen.getByText("Join"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/groups/join", expect.any(Object));
    });
  });
});
