<?php

require_once "pel/autoload.php";
use lsolesen\pel\PelJpeg;
use lsolesen\pel\PelExif;
use lsolesen\pel\PelTiff;
use lsolesen\pel\PelTag;
use lsolesen\pel\PelIfd;
use lsolesen\pel\PelEntryAscii;
use lsolesen\pel\PelEntryRational;

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

if (isset($_POST["submit"])) {
  if (!strlen($_POST['image']) > 0) $uploadOk = 0;
} else {
  die("No data to process...");
}

if (file_exists($target_file)) $uploadOk = 0;

if ($uploadOk == 1) {
  $img = $_POST['image'];
  $img = str_replace('data:image/jpeg;base64,', '', $img);
  $img = str_replace(' ', '+', $img);

  $content = base64_decode($img);

  if (file_put_contents($target_file, $content)) {
    error_log("The file ". $filename ." has been uploaded.");
  } else {
    $uploadOk = 0;
  }
}

if ($uploadOk == 1) {
  $path = $target_file;

  if (isset($_POST['emotion']) && in_array($_POST['emotion'], array('happy', 'sad', 'angry'))) {
    $em = $_POST['emotion'];
  } else {
    $em = "No emotion set";
  }

  $iptc = ['2#005' => $em];

  if (isset($_POST['createdate']) && $_POST['createdate'] != '') {
    $iptc['2#055'] = explode(' ', $_POST['createdate'])[0];
    $iptc['2#060'] = explode(' ', $_POST['createdate'])[1];
  }

  $data = '';

  foreach($iptc as $tag => $string) {
    $tag = substr($tag, 2);
    $data .= iptc_make_tag(2, $tag, $string);
  }

  $content = iptcembed($data, $path);

  $fp = fopen($path, "wb");
  fwrite($fp, $content);
  fclose($fp);

  if ($_POST['geoloc'] != "unknown") {
    $pelJpeg = new PelJpeg($target_file);

    $pelExif = $pelJpeg->getExif();
    if ($pelExif == null) {
      $pelExif = new PelExif();
      $pelJpeg->setExif($pelExif);
    }

    $pelTiff = $pelExif->getTiff();
    if ($pelTiff == null) {
      $pelTiff = new PelTiff();
      $pelExif->setTiff($pelTiff);
    }

    $pelIfd0 = $pelTiff->getIfd();
    if ($pelIfd0 == null) {
      $pelIfd0 = new PelIfd(PelIfd::IFD0);
      $pelTiff->setIfd($pelIfd0);
    }

    $pelSubIfdGps = new PelIfd(PelIfd::GPS);
    $pelIfd0->addSubIfd($pelSubIfdGps);

    setGeolocation($pelSubIfdGps, explode(',',$_POST['geoloc'])[0], explode(',',$_POST['geoloc'])[1]);

    $pelJpeg->saveFile($target_file);
  }
}

function setGeolocation($pelSubIfdGps, $latitudeDegreeDecimal, $longitudeDegreeDecimal) {
  $latitudeRef = ($latitudeDegreeDecimal >= 0) ? 'N' : 'S';
  $latitudeDegreeMinuteSecond
  = degreeDecimalToDegreeMinuteSecond(abs($latitudeDegreeDecimal));
  $longitudeRef= ($longitudeDegreeDecimal >= 0) ? 'E' : 'W';
  $longitudeDegreeMinuteSecond
  = degreeDecimalToDegreeMinuteSecond(abs($longitudeDegreeDecimal));

  $pelSubIfdGps->addEntry(new PelEntryAscii(PelTag::GPS_LATITUDE_REF, $latitudeRef));
  $pelSubIfdGps->addEntry(new PelEntryRational(PelTag::GPS_LATITUDE, array($latitudeDegreeMinuteSecond['degree'], 1), array($latitudeDegreeMinuteSecond['minute'], 1), array(round($latitudeDegreeMinuteSecond['second'] * 1000), 1000)));

  $pelSubIfdGps->addEntry(new PelEntryAscii(PelTag::GPS_LONGITUDE_REF, $longitudeRef));
  $pelSubIfdGps->addEntry(new PelEntryRational(PelTag::GPS_LONGITUDE, array($longitudeDegreeMinuteSecond['degree'], 1), array($longitudeDegreeMinuteSecond['minute'], 1), array(round($longitudeDegreeMinuteSecond['second'] * 1000), 1000)));
}

function degreeDecimalToDegreeMinuteSecond($degreeDecimal) {
  $degree = floor($degreeDecimal);
  $remainder = $degreeDecimal - $degree;
  $minute = floor($remainder * 60);
  $remainder = ($remainder * 60) - $minute;
  $second = $remainder * 60;
  return array('degree' => $degree, 'minute' => $minute, 'second' => $second);
}

header("Location: capture.html");
?>
