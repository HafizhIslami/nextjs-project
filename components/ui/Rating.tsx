interface Props {
  value: number;
  size?: "small" | "large";
}

const Rating = ({ value, size = "small" }: Props) => {
  const safeValue = Math.min(5, Math.max(0, Number(value) || 0));
  const roundedValue = Math.round(safeValue);

  return (
    <span
      className={`rating-display rating-display-${size}`}
      role="img"
      aria-label={`${safeValue.toFixed(1)} out of 5 stars`}
    >
      <span aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            className={index < roundedValue ? "rating-star filled" : "rating-star"}
            key={index}
          />
        ))}
      </span>
    </span>
  );
};

export default Rating;
