// Seat ids look like "A1", "B12" (row letter + seat number)
exports.isValidSeat = (screen, seat) => {
  const m = /^([A-Z])(\d{1,2})$/.exec(seat || '');
  if (!m) return false;
  const row = m[1].charCodeAt(0) - 65;
  const num = Number(m[2]);
  return row < screen.rows && num >= 1 && num <= screen.seatsPerRow;
};
