'use server'

import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/auth';
import { SalesOrderService } from '@/modules/sales/services/so.service';
import { SalesOrderRepository } from '@/modules/sales/repositories/so.repository';
import { DeliveryService } from '@/modules/sales/services/delivery.service';
import { SalesInvoiceService } from '@/modules/sales/services/sales-invoice.service';

export async function getSalesOrdersAction(tenantSlug: string) {
  const { orgMember } = await requirePermission(tenantSlug, 'sales.view');
  return SalesOrderRepository.findAll(orgMember.org_id);
}

export async function createSalesOrderAction(tenantSlug: string, payload: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'sales.manage');
  
  await SalesOrderService.createSO(orgMember.org_id, payload, user.id);
  
  revalidatePath(`/${tenantSlug}/sales/orders`);
}

export async function processDeliveryAction(tenantSlug: string, payload: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'sales.manage');
  
  await DeliveryService.processDelivery(tenantSlug, orgMember.org_id, user.id, payload);
  
  revalidatePath(`/${tenantSlug}/sales/orders`);
  revalidatePath(`/${tenantSlug}/sales/deliveries`);
}

export async function postCustomerInvoiceAction(tenantSlug: string, payload: any) {
  const { user, orgMember } = await requirePermission(tenantSlug, 'sales.manage');
  
  await SalesInvoiceService.postInvoice(orgMember.org_id, payload, user.id);
  
  revalidatePath(`/${tenantSlug}/sales/invoices`);
}
