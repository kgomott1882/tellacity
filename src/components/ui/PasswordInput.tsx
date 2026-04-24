"use client";

import { forwardRef, useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Drop-in replacement for `<input type="password" />` that adds a small
 * show/hide eye toggle on the right. The component forwards every standard
 * input prop (value, onChange, name, autoComplete, placeholder, id, className,
 * disabled, required, minLength, etc.) so callers can swap it in without
 * changing their existing auth / form flows — the only thing this owns is the
 * `type` attribute, which flips between `password` and `text` locally.
 *
 * We intentionally inject a `relative` wrapper so the toggle can be absolutely
 * positioned over the input's right edge, and we tack on `pr-11` to the
 * input's class list to reserve space for the button.
 */
export type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className = "", ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const generatedId = useId();
    const inputId = rest.id ?? generatedId;

    return (
      <div className="relative block">
        <input
          {...rest}
          id={inputId}
          ref={ref}
          type={visible ? "text" : "password"}
          className={`${className} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 disabled:opacity-50"
          disabled={rest.disabled}
        >
          {visible ? (
            <EyeOff size={18} aria-hidden />
          ) : (
            <Eye size={18} aria-hidden />
          )}
        </button>
      </div>
    );
  }
);

export default PasswordInput;
