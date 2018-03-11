<?php

/*
 * works under web framework yii2
 */

namespace app\controllers;

use Yii;
use yii\web\Controller;

class XfileuploaderController extends Controller {
	private static $g_KeyCode = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

	// 参考：http://www.jb51.net/article/36242.htm
	public static function random($length) {
		$hash = "";
		$chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
		$max = strlen($chars) - 1;
		PHP_VERSION < '4.2.0' && mt_srand((double)microtime() * 1000000);
		for ($i = 0; $i < $length; $i++) {
        	$hash .= $chars[mt_rand(0, $max)];
    	}

		return $hash;
	}

	// 参考：http://www.jb51.net/article/36242.htm
	public static function hex64to10($m, $len = 0) {
        $m = (string)$m;
        $hex2 = '';
        $Code = self::$g_KeyCode;
        for($i = 0, $l = strlen($Code); $i < $l; $i++) {
            $KeyCode[] = $Code[$i];
        }
        $KeyCode = array_flip($KeyCode);

        for($i = 0, $l = strlen($m); $i < $l; $i++) {
            $one = $m[$i];
            $hex2 .= str_pad(decbin($KeyCode[$one]), 6, '0', STR_PAD_LEFT);
        }
        $return = bindec($hex2);

        if($len) {
            $clen = strlen($return);
            if($clen >= $len) {
                return $return;
            }
            else {
                return str_pad($return, $len, '0', STR_PAD_LEFT);
            }
        }
        return $return;
    }

	// 参考：http://www.jb51.net/article/36242.htm
	public static function hex10to64($m, $len = 0) {
        $KeyCode = self::$g_KeyCode;
        $hex2 = decbin($m);
        $hex2 = self::str_rsplit($hex2, 6);
        $hex64 = array();
        foreach($hex2 as $one) {
            $t = bindec($one);
            $hex64[] = $KeyCode[$t];
        }
        $return = preg_replace('/^0*/', '', implode('', $hex64));
        if($len) {
            $clen = strlen($return);
            if($clen >= $len) {
                return $return;
            }
            else {
                return str_pad($return, $len, '0', STR_PAD_LEFT);
            }
        }
        return $return;
    }

	// 参考：http://www.jb51.net/article/36242.htm
	public static function hex16to64($m, $len = 0) {
        $KeyCode = self::$g_KeyCode;
        $hex2 = array();
        for($i = 0, $j = strlen($m); $i < $j; ++$i) {
            $hex2[] = str_pad(base_convert($m[$i], 16, 2), 4, '0', STR_PAD_LEFT);
        }
        $hex2 = implode('', $hex2);
        $hex2 = self::str_rsplit($hex2, 6);
        foreach($hex2 as $one) {
            $hex64[] = $KeyCode[bindec($one)];
        }
        $return = preg_replace('/^0*/', '', implode('', $hex64));
        if($len) {
            $clen = strlen($return);
            if($clen >= $len) {
                return $return;
            }
            else {
                return str_pad($return, $len, '0', STR_PAD_LEFT);
            }
        }
        return $return;
    } 

	// 参考：http://www.jb51.net/article/36242.htm
	public static function str_rsplit($str, $len = 1) {
        if($str == null || $str == false || $str == '') return false;
        $strlen = strlen($str);
        if($strlen <= $len) return array($str);
        $headlen = $strlen % $len;
        if($headlen == 0) {
            return str_split($str, $len);
        }
        $return = array(substr($str, 0, $headlen));
        return array_merge($return, str_split(substr($str, $headlen), $len));
    }

	public function actionUpload() {
		$rsp = [
			"code" => 200,
			"data" => []
		];

		for ($i = 0; $i < count($_FILES["file"]["name"]); ++$i) {
			$file_name = $_FILES["file"]["name"][$i];
			$file_mime = $_FILES["file"]["type"][$i];
			$tmp_file = $_FILES["file"]["tmp_name"][$i];

			$under_module = "";
			if (array_key_exists("underModule", $_POST)) {
				$under_module = $_POST["underModule"];
			}
			$file_category = "";
			if (array_key_exists("fileCategory", $_POST)) {
				$file_category = $_POST["fileCategory"];
			}

			// 生成存储路径
			$cur_date = Date("Ymd", time());
			// 项目物理路径
			$proj_path = rtrim(Yii::$app->basePath, "/");
			// 相对于项目的根路径的相对路径
			//$upload_base_path = Yii::app()->params["uploadConf"]["baseDir"];
			$upload_base_path = "/uploads";

			$local_path = rtrim($upload_base_path, "/");
			if ($under_module != "") {
				$local_path .= "/" . rtrim($under_module, "/");
			}
			if ($file_category != "") {
				$local_path .= "/" . rtrim($file_category, "/");
			}
			$local_path .= "/" . $cur_date;

			// 生成文件名：参考http://www.jb51.net/article/36242.htm
			$tmp_file_name = "";
			// $user_id 将10进制转为64进制
			// TODO
			// 时间戳的间隔时间转为64进制
			$tmp_file_name .= self::hex10to64(time() - strtotime("2018-01-01"));
			
			// 3位随机数
			$tmp_file_name .= self::random(3);

			$ext_name = "";
			switch ($file_mime) {
			case "image/jpeg":
			case "image/jpg":
				$ext_name = "jpg";
			break;
			case "image/png":
				$ext_name = "png";
			break;
			case "image/gif":
				$ext_name = "gif";
			break;
			}
			$local_file_name = $tmp_file_name . "." . $ext_name;

			$file_url = Yii::$app->request->hostinfo . $local_path . "/" . $local_file_name;

			$store_to_path = $proj_path . "/web/" . ltrim($local_path, "/");
			if (!is_dir($store_to_path)) {
				@mkdir($store_to_path, 0777, true);
			}
			$store_to =  $store_to_path . "/" . $local_file_name;

			$result = move_uploaded_file($tmp_file, $store_to);
			if ($result == true) {
				$rsp["data"][] = [
					"url" => $file_url,
					"type" => $file_mime
				];
			} else {
			}
		}

		$rsp["code"] = 200;

		echo json_encode($rsp);
	}
}

?>
