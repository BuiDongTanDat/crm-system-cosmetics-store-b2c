import React from "react";

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={
      "relative inline-flex h-6 w-11 items-center rounded-full transition " +
      (checked ? "bg-blue-500" : "bg-gray-300") +
      (disabled ? " opacity-60 cursor-not-allowed" : "")
    }
    aria-checked={checked}
    aria-label="Toggle"
  >
    <span
      className={
        "inline-block h-5 w-5 transform rounded-full bg-white transition " +
        (checked ? "translate-x-5.5" : "translate-x-0.5")
      }
    />
  </button>
);

export default Toggle;
