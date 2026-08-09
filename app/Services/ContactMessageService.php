<?php

namespace App\Services;

use App\Enums\ContactMessageStatus;
use App\Interfaces\ContactMessageRepositoryInterface;
use App\Repositories\ContactMessageRepository;

class ContactMessageService
{
    protected $contactMessageRepository;

    public function __construct(ContactMessageRepositoryInterface $contactMessageRepository)
    {
        $this->contactMessageRepository = $contactMessageRepository;
    }

    public function getAdminList()
    {
        return $this->contactMessageRepository->getAllForAdmin();
    }

    public function markAsRead($id)
    {
        $message = $this->contactMessageRepository->findById($id);
        return $this->contactMessageRepository->update($message, [
            'status' => ContactMessageStatus::READ->value,
        ]);
    }

    public function markAsResolved($id)
    {
        $message = $this->contactMessageRepository->findById($id);
        return $this->contactMessageRepository->update($message, [
            'status' => ContactMessageStatus::RESOLVED->value,
        ]);
    }

    public function store(array $data)
    {
        return $this->contactMessageRepository->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'],
            'message' => $data['message'],
            'status' => ContactMessageStatus::UNREAD->value,
        ]);
    }
}
