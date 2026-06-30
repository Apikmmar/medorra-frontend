"use client";

import { useState, useMemo } from "react";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  helpText?: string;
  /** Show live password strength rules */
  showRules?: boolean;
  /** Disable copy/paste in the field */
  disableCopyPaste?: boolean;
}

interface PasswordRule {
  label: string;
  met: boolean;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = true,
  minLength,
  maxLength,
  helpText,
  showRules = false,
  disableCopyPaste = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const rules: PasswordRule[] = useMemo(() => {
    if (!showRules) return [];
    return [
      { label: "At least 8 characters", met: value.length >= 8 },
      { label: "At most 128 characters", met: value.length <= 128 || value.length === 0 },
      { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(value) },
      { label: "One lowercase letter (a-z)", met: /[a-z]/.test(value) },
      { label: "One digit (0-9)", met: /\d/.test(value) },
    ];
  }, [value, showRules]);

  function handlePrevent(e: React.ClipboardEvent) {
    if (disableCopyPaste) {
      e.preventDefault();
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onCopy={handlePrevent}
          onPaste={handlePrevent}
          onCut={handlePrevent}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {helpText && !showRules && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {showRules && value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rules.map((rule) => (
            <li key={rule.label} className="flex items-center gap-2 text-xs">
              {rule.met ? (
                <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <XIcon className="h-3.5 w-3.5 text-gray-300" />
              )}
              <span className={rule.met ? "text-green-700" : "text-gray-500"}>
                {rule.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-2.38.75.75 0 00-1.08-1.04A8.526 8.526 0 0114.67 14.1l-1.44-1.44A4 4 0 009.34 8.77l-1.745-1.745A10.03 10.03 0 0110 6.5c3.546 0 6.663 1.903 8.336 4.91a.75.75 0 010 .68 10.03 10.03 0 01-1.745 2.58L3.28 2.22zM7.747 9.808a2.5 2.5 0 003.445 3.445l-3.445-3.445z"
        clipRule="evenodd"
      />
      <path d="M10.036 13.5A3.99 3.99 0 016 10c0-.275.028-.544.08-.804L3.707 6.824A10.032 10.032 0 001.664 9.41a.75.75 0 000 .68A10.004 10.004 0 0010 16.5c.69 0 1.362-.07 2.013-.2l-1.977-1.977v-.823z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}
