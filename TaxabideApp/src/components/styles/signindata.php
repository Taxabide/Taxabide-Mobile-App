<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include("../config/conn.php"); 

$email = $_GET['email'];
$password = md5($_GET['password']);

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Email and password required."]);
    exit;
}

$sql = "SELECT * FROM tbl_login WHERE l_email='$email' AND l_password='$password'";

$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    echo json_encode(["success" => true, "data" => $row]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid credentials."]);
}
?>
