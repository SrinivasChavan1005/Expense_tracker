import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayouts from "../../components/layouts/AuthLayouts";
import { TextField } from "../../components/ui/FormField";
import Button from "../../components/ui/Button";
import PasswordToggle from "../../components/auth/PasswordToggle";
import { useAuth } from "../../hooks/useAuth";
import { PASSWORD_HINT, validateSignUpForm } from "../../utils/validation";
import { getErrorMessage, getFieldErrors } from "../../utils/helper";

const INITIAL_FORM = { name: "", email: "", password: "", confirmPassword: "" };

const SignUp = () => {
  const { register } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const validationErrors = validateSignUpForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      // confirmPassword is only checked in the browser; the API doesn't need it.
      const user = await register({ name: form.name, email: form.email, password: form.password });
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayouts>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-2">Start tracking your income and expenses in minutes.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && (
          <div role="alert" className="rounded-lg border border-expense-text/20 bg-expense-soft px-3.5 py-2.5 text-sm text-expense-text">
            {formError}
          </div>
        )}

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Priya Sharma"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint={PASSWORD_HINT}
          required
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        />
        <TextField
          label="Confirm password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent-700 underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayouts>
  );
};

export default SignUp;
