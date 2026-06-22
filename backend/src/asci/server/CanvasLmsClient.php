<?php

namespace asci\server;

class CanvasLmsClient {
    const BASE_URL = "https://canvas.its.virginia.edu";
    const USER_AGENT = "ASCI/1.0";

    private $accessToken;
    private $logger;
    private $lastError = null;

    public function __construct($accessToken, $logger = null) {
        $this->accessToken = $accessToken;
        $this->logger = $logger;
    }

    public function getLastError() {
        return $this->lastError;
    }

    public function get($path) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, self::BASE_URL . $path);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array("Authorization: Bearer {$this->accessToken}", "User-Agent: " . self::USER_AGENT));
        $response = curl_exec($ch);

        if ($errno = curl_errno($ch)) {
            curl_close($ch);
            $error = "cURL error ({$errno}): " . curl_strerror($errno);
            $this->fail($error);
            return ["ok" => false, "http_code" => 0, "body" => null, "error" => $error];
        }

        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code !== 200) {
            $error = "HTTP error: " . $http_code;
            $this->fail($error);
            return ["ok" => false, "http_code" => $http_code, "body" => null, "error" => $error];
        }

        return ["ok" => true, "http_code" => $http_code, "body" => json_decode($response, true), "error" => null];
    }

    public function getAll($path, $query = "", $itemsKey = null) {
        $url = self::BASE_URL . $path . ($query !== "" ? "?" . $query : "");
        $results = [];

        while ($url) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array("Authorization: Bearer {$this->accessToken}", "User-Agent: " . self::USER_AGENT));
            curl_setopt($ch, CURLOPT_HEADER, true);

            $response = curl_exec($ch);

            if ($errno = curl_errno($ch)) {
                curl_close($ch);
                $this->fail("cURL error ({$errno}): " . curl_strerror($errno));
                return null;
            }

            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
            curl_close($ch);

            if ($http_code !== 200) {
                $this->fail("HTTP error: " . $http_code);
                return null;
            }

            $headers = substr($response, 0, $header_size);
            $body = substr($response, $header_size);
            $data = json_decode($body, true);

            $items = $itemsKey === null ? $data : (isset($data[$itemsKey]) ? $data[$itemsKey] : null);
            if (is_array($items)) {
                foreach ($items as $item) {
                    $results[] = $item;
                }
            }

            $url = $this->nextLink($headers);
        }

        return $results;
    }

    private function nextLink($headers) {
        foreach (explode("\n", $headers) as $header) {
            if (stripos($header, 'Link:') === 0) {
                foreach (explode(",", $header) as $part) {
                    if (strpos($part, 'rel="next"') !== false) {
                        preg_match('/<(.+?)>/', $part, $matches);
                        if ($matches) return trim($matches[1]);
                    }
                }
            }
        }
        return null;
    }

    private function fail($message) {
        $this->lastError = $message;
        if ($this->logger !== null) {
            $this->logger->addError($message);
        }
    }
}
