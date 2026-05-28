import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/app-error.js";
import { ERROR_CODES } from "../../shared/errors/error-codes.js";
import { sendSuccess } from "../../shared/http/response.js";
import { aiProxyService } from "./ai-proxy.service.js";

function requireAccessToken(request: Request): string {
  if (!request.currentUser || !request.authAccessToken) {
    throw new AppError("Missing authenticated user", 401, ERROR_CODES.UNAUTHORIZED);
  }
  return request.authAccessToken;
}

export async function listConversations(request: Request, response: Response) {
  const data = await aiProxyService.listConversations(requireAccessToken(request));
  return sendSuccess(response, data);
}

export async function createConversation(request: Request, response: Response) {
  const data = await aiProxyService.createConversation(
    request.body,
    requireAccessToken(request),
  );
  return sendSuccess(response, data, undefined, 201);
}

export async function deleteConversation(request: Request, response: Response) {
  const data = await aiProxyService.deleteConversation(
    request.params.conversationId,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function listMessages(request: Request, response: Response) {
  const data = await aiProxyService.listMessages(
    request.params.conversationId,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function submitInteraction(request: Request, response: Response) {
  const data = await aiProxyService.submitInteraction(
    request.params.conversationId,
    request.body,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function listBpRecords(request: Request, response: Response) {
  const data = await aiProxyService.listBpRecords(
    request.query as Record<string, unknown>,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function getBpRecord(request: Request, response: Response) {
  const data = await aiProxyService.getBpRecord(
    request.params.recordId,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function createBpRecord(request: Request, response: Response) {
  const data = await aiProxyService.createBpRecord(
    request.body,
    requireAccessToken(request),
  );
  return sendSuccess(response, data, undefined, 201);
}

export async function updateBpRecord(request: Request, response: Response) {
  const data = await aiProxyService.updateBpRecord(
    request.params.recordId,
    request.body,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function deleteBpRecord(request: Request, response: Response) {
  const data = await aiProxyService.deleteBpRecord(
    request.params.recordId,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function getRiskProfile(request: Request, response: Response) {
  const data = await aiProxyService.getRiskProfile(requireAccessToken(request));
  return sendSuccess(response, data);
}

export async function saveRiskProfile(request: Request, response: Response) {
  const data = await aiProxyService.saveRiskProfile(
    request.body,
    requireAccessToken(request),
  );
  return sendSuccess(response, data);
}

export async function getLatestReport(request: Request, response: Response) {
  const data = await aiProxyService.getLatestReport(requireAccessToken(request));
  return sendSuccess(response, data);
}

export async function generateReport(request: Request, response: Response) {
  const data = await aiProxyService.generateReport(requireAccessToken(request));
  return sendSuccess(response, data, undefined, 201);
}
