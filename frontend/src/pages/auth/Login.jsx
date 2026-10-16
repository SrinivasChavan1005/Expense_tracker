import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayouts from "../../components/layouts/AuthLayouts";
import { TextField } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import PasswordToggle from "../../components/auth/PasswordToggle";
import { useAuth } from "../../hooks/useAuth";
import { validateLoginForm } from "../../utils/validation";
import { getErrorMessage, getFieldErrors } from "../../utils/helper";

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // One change handler for every input, keyed by the input's `name`.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // stop the browser's full-page form submit
    setFormError("");
    const validationErrors = validateLoginForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      // PublicOnlyRoute notices we're logged in and redirects to the dashboard
      // (or to the page the user originally asked for).
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayouts>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-2">Log in to see your dashboard.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && (
          <div role="alert" className="rounded-lg border border-expense-text/20 bg-expense-soft px-3.5 py-2.5 text-sm text-expense-text">
            {formError}
          </div>
        )}

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Don't have an account?{" "}
        <Link to="/signup" className="font-medium text-accent-700 underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayouts>
  );
};

export default Login;
