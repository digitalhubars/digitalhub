// Small teal text action used in card headers ("View products", "Manage", ...).
export default function LinkButton({ className = '', ...props }) {
  return (
    <button
      type="button"
      className={`text-xs font-medium text-teal-700 hover:underline dark:text-teal-300 ${className}`.trim()}
      {...props}
    />
  );
}
