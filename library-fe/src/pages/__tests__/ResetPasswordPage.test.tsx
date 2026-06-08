import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ResetPasswordPage from "../ResetPasswordPage";

// Mock router hooks
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams([["token", "valid-token-123"]]);

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn().mockReturnValue("loading-id"),
    removeToast: vi.fn(),
  }),
}));

const mockResetPassword = vi.fn();
vi.mock("@/utils/auth-client", () => ({
  authClient: {
    resetPassword: (...args: any[]) => mockResetPassword(...args),
  },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams([["token", "valid-token-123"]]);
  });

  it("should render the form if token is present", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Buat Sandi Baru")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Minimal 8 karakter")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ulangi kata sandi baru")).toBeInTheDocument();
  });

  it("should not allow submit if passwords do not match", async () => {
    render(<ResetPasswordPage />);
    
    const newPasswordInput = screen.getByPlaceholderText("Minimal 8 karakter");
    const confirmPasswordInput = screen.getByPlaceholderText("Ulangi kata sandi baru");
    
    fireEvent.change(newPasswordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password321" } });

    // The submit button should be disabled
    const submitBtn = screen.getByRole("button", { name: /Simpan Kata Sandi Baru/i });
    expect(submitBtn).toBeDisabled();
    
    // Validation text should appear
    expect(screen.getByText("Kata sandi tidak cocok")).toBeInTheDocument();
  });

  it("should submit successfully if passwords match and are >= 8 chars", async () => {
    mockResetPassword.mockResolvedValueOnce({ data: { success: true }, error: null });

    render(<ResetPasswordPage />);
    
    const newPasswordInput = screen.getByPlaceholderText("Minimal 8 karakter");
    const confirmPasswordInput = screen.getByPlaceholderText("Ulangi kata sandi baru");
    
    fireEvent.change(newPasswordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Kata Sandi Baru/i });
    expect(submitBtn).not.toBeDisabled();
    
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        newPassword: "password123",
        token: "valid-token-123",
      });
    });

    // Success UI should appear
    await waitFor(() => {
      expect(screen.getByText("Sandi Berhasil Diperbarui!")).toBeInTheDocument();
    });
  });

  it("should show error if reset fails", async () => {
    mockResetPassword.mockResolvedValueOnce({ 
      data: null, 
      error: { message: "Token expired" } 
    });

    render(<ResetPasswordPage />);
    
    const newPasswordInput = screen.getByPlaceholderText("Minimal 8 karakter");
    const confirmPasswordInput = screen.getByPlaceholderText("Ulangi kata sandi baru");
    
    fireEvent.change(newPasswordInput, { target: { value: "password123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: /Simpan Kata Sandi Baru/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalled();
    });

    // Form should still be visible because it didn't succeed
    expect(screen.getByRole("button", { name: /Simpan Kata Sandi Baru/i })).toBeInTheDocument();
  });
});
