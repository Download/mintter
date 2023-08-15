// @generated by protoc-gen-connect-web v0.8.6 with parameter "target=ts,import_extension=none"
// @generated from file entities/v1alpha/entities.proto (package com.mintter.entities.v1alpha, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import { Change, EntityTimeline, GetChangeRequest, GetEntityTimelineRequest } from "./entities_pb";
import { MethodKind } from "@bufbuild/protobuf";

/**
 * Provides functionality to query information about Hyperdocs Entities.
 *
 * @generated from service com.mintter.entities.v1alpha.Entities
 */
export const Entities = {
  typeName: "com.mintter.entities.v1alpha.Entities",
  methods: {
    /**
     * Gets a change by ID.
     *
     * @generated from rpc com.mintter.entities.v1alpha.Entities.GetChange
     */
    getChange: {
      name: "GetChange",
      I: GetChangeRequest,
      O: Change,
      kind: MethodKind.Unary,
    },
    /**
     * Gets the DAG of changes for an entity.
     *
     * @generated from rpc com.mintter.entities.v1alpha.Entities.GetEntityTimeline
     */
    getEntityTimeline: {
      name: "GetEntityTimeline",
      I: GetEntityTimelineRequest,
      O: EntityTimeline,
      kind: MethodKind.Unary,
    },
  }
} as const;
