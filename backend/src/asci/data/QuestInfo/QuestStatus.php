<?php

namespace asci\data\QuestInfo;

error_reporting(E_ALL);
ini_set('display_errors', 0);

class QuestStatus
{

    /**
     * @var \Monolog\Logger $logger the logger for this server
     */
    private $logger;
    private $courseId;

    private $db;
    // private $currQuest;

    public function __construct($db, $courseId)
    {
        $this->db = $db;
        $this->courseId = $courseId;

        global $log;
        $this->logger = new \Monolog\Logger('QuestStatus');
        $this->logger->pushHandler($log);

    }


    public function changeStatus($currQuest)
    {
        if ($currQuest->getQuestCompletionStatus() != 'Completed') {
            $questId = $currQuest->getQuestId();
            $userId = $currQuest->getUserId();
            $mnemonic = $currQuest->getMnemonic();
            $qname = $currQuest->getName();
            $computing_id = ((new \asci\server\database\DBUser($this->db))->getUserById($userId)) -> getComputingId();
            
            if(strtoupper(substr($mnemonic, 0, 2)) == "OH")
            { 
                $count = $this->OfficeHoursCount($userId, $this->courseId);
                $ohQuests = (new \asci\server\database\DBUserQuest($this->db))->getOHQuests($computing_id, $this->courseId);
                $this->logger->addDebug("OH Count", array("id" => $computing_id, "count" => $count));
                $frequency = intval(substr($mnemonic, 2));
                if ($count >= $frequency) {
                    (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                    $currQuest->setQuestCompletionStatus('Completed');
                    //set higher count office hours quests to in-progress
                    foreach($ohQuests as $quest){
                        $otherQID = $quest->getQuestId();
                        if(intval(substr($quest->getMnemonic(), 2)) > $frequency){
                            (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($otherQID, $userId, $this->courseId, 'In progress');
                        }
                    }
                }
            }
            else if(strtoupper(substr($mnemonic, 0, 1)) == "P" && str_contains(strtolower($qname), "piazza")){
                $count = $this->PiazzaPostCount($userId, $this->courseId);
                $pQuests = (new \asci\server\database\DBUserQuest($this->db))->getPiazzaQuests($computing_id, $this->courseId);
                
                $frequency = intval(substr($mnemonic, 1));
                if ($count >= $frequency) {
                    (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
                    $currQuest->setQuestCompletionStatus('Completed');
                    //set higher count piazza quests to in-progress
                    foreach($pQuests as $quest){
                        $otherQID = $quest->getQuestId();
                        if(intval(substr($quest->getMnemonic(), 1)) > $frequency){
                            (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($otherQID, $userId, $this->courseId, 'In progress');
                        }
                    }
                }
            }

            //previous hard-coded automation
            // switch ($currQuest->getMnemonic()) {
            //     case "OH1":
            //         if ($count >= 1) {
            //             (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
            //             $currQuest->setQuestCompletionStatus('Completed');
            //             //set higher count office hours quests to in-progress!
            //             // foreach($ohQuests as $quests){
            //             //     if(int(substr($quests["mnenomic"], 2)) > 1){
            //             //         (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'In progress');
            //             //     }
            //             // }
            //         }
            //     case "OH3":
            //         if ($count >= 3) {
            //             (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
            //             $currQuest->setQuestCompletionStatus('Completed');
            //         }
            //     case "OH10":
            //         if ($count >= 10) {
            //             (new \asci\server\database\DBUserQuest($this->db))->updateQuestStatus($questId, $userId, $this->courseId, 'Completed');
            //             $currQuest->setQuestCompletionStatus('Completed');
            //         }
            // }
        }
    }

    public function OfficeHoursCount($userId, $courseId)
    {
        return (new \asci\server\database\DBSession($this->db))->getCompletedOfficehoursCount($userId, $courseId);
    }

    public function PiazzaPostCount($userId, $courseId)
    {
        return (new \asci\server\database\DBUser($this->db))->getPiazzaPostCount($userId, $courseId);
    }
}