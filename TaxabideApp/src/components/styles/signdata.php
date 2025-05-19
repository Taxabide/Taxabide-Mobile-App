<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

include("../config/conn.php"); // Your DB connection

// Get JSON data from React
$data = $_POST;

$l_name        = $data['l_name'];
$l_email       = $data['l_email'];
$l_password    = md5($data['l_password']);
$l_number      = $data['l_number'];
$l_address     = $data['l_address'];
$l_pin_code    = $data['l_pin_code'];
$l_pan_no      = $data['l_pan_no'];
$l_aadhar      = $data['l_aadhar'];
$l_profile_photo = $data['l_profile_photo'] ?? ''; // optional
$l_status      = 0;
$l_role        = "0";
$l_add_date    = date("Y-m-d");
// Check if email already exists
// $checkQuery = "SELECT * FROM tbl_login WHERE l_email = '$l_email'";
// $checkResult = mysqli_query($conn, $checkQuery);
// if (mysqli_num_rows($checkResult) > 0) {
//     echo json_encode(["success" => false, "message" => "Email already registered."]);
//     exit;
// }

// Insert new user
$sql = "INSERT INTO tbl_login (
    l_name, l_email, l_password, l_number, l_address, l_pin_code, l_pan_no, l_aadhar, 
    l_profile_photo, l_status, l_role, l_add_date
) VALUES (
    '$l_name', '$l_email', '$l_password', '$l_number', '$l_address', '$l_pin_code', '$l_pan_no', '$l_aadhar',
    '$l_profile_photo', '$l_status', '$l_role', '$l_add_date'
)";

if (mysqli_query($conn, $sql)) {
    echo json_encode(["success" => true, "message" => "Registration successful."]);
} else {
    echo json_encode(["success" => false, "message" => "Error: " . mysqli_error($conn)]);
}
?>
