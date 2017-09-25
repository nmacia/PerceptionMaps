<?php

function iptc_make_tag($rec, $data, $value) {
    $length = strlen($value);
    $retval = chr(0x1C) . chr($rec) . chr($data);

    if($length < 0x8000) {
        $retval .= chr($length >> 8) .  chr($length & 0xFF);
    } else {
        $retval .= chr(0x80) .
                   chr(0x04) .
                   chr(($length >> 24) & 0xFF) .
                   chr(($length >> 16) & 0xFF) .
                   chr(($length >> 8) & 0xFF) .
                   chr($length & 0xFF);
    }

    return $retval . $value;
}


$target_dir = "uploads/";
while (true) {
 $filename = uniqid('IPTC', true) . '.jpg';
 if (!file_exists(sys_get_temp_dir() . $filename)) break;
}

$target_file = $target_dir . $filename;
$uploadOk = 1;
$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);

if(isset($_POST["submit"])) {
    $check = getimagesize($_FILES["file"]["tmp_name"]);
    if($check !== false) $uploadOk = 1; else $uploadOk = 0;
}

if (file_exists($target_file)) $uploadOk = 0;
if ($_FILES["file"]["size"] > 2000000) $uploadOk = 0;
if($imageFileType != "jpg" && $imageFileType != "jpeg") $uploadOk = 0;

if ($uploadOk == 1) {
    if (move_uploaded_file($_FILES["file"]["tmp_name"], $target_file)) {
        error_log("The file ". $filename ." has been uploaded.");
    } else {
	$uploadOk = 0;
    }
}

if ($uploadOk == 1) {
    $path = $target_file;

    if (isset($_POST['emotion']) && in_array($_POST['emotion'], array('happy', 'sad', 'clean', 'dirty')))
        $em = $_POST['emotion'];
    else
        $em = "No emotion set";

    $iptc = array('2#005' => $em);

    $data = '';

    foreach($iptc as $tag => $string) {
        $tag = substr($tag, 2);
        $data .= iptc_make_tag(2, $tag, $string);
    }

    $content = iptcembed($data, $path);

    $fp = fopen($path, "wb");
    fwrite($fp, $content);
    fclose($fp);
}

header("Location: capture.html");
?>
