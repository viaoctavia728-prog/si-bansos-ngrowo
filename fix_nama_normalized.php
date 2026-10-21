<?php
// Script sementara untuk fix kolom nama_normalized di eligible_residents
$host = '127.0.0.1';
$db   = 'db_sibansos_ngrowo';
$user = 'sibansos_user';
$pass = 'sibansos_pass';
$port = 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Ambil semua data
    $stmt = $pdo->query("SELECT id, nik, nama_lengkap, nama_normalized FROM eligible_residents");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updated = 0;
    $skipped = 0;

    foreach ($rows as $row) {
        // normalize: lowercase + collapse whitespace (sama seperti Python normalize_name)
        $normalized = mb_strtolower(preg_replace('/\s+/', ' ', trim($row['nama_lengkap'])), 'UTF-8');

        if ($row['nama_normalized'] !== $normalized) {
            echo "UPDATE NIK {$row['nik']}: [{$row['nama_normalized']}] -> [{$normalized}]\n";
            $upd = $pdo->prepare("UPDATE eligible_residents SET nama_normalized = ? WHERE id = ?");
            $upd->execute([$normalized, $row['id']]);
            $updated++;
        } else {
            $skipped++;
        }
    }

    echo "\n✅ Selesai! Updated: $updated, Skipped (sudah benar): $skipped\n";
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
